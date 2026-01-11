use std::collections::HashMap;
use std::io::Read;
use crate::s3::S3Client;

pub struct R2GitStore {
    pub s3: S3Client,
    pub prefix: String,
    object_cache: tokio::sync::RwLock<HashMap<String, Vec<u8>>>,
    pack_cache: tokio::sync::RwLock<Option<PackCache>>,
}

struct PackCache {
    pack_data: Vec<u8>,
    idx_data: Vec<u8>,
}

impl R2GitStore {
    pub fn new(s3: S3Client, prefix: String) -> Self {
        Self {
            s3,
            prefix,
            object_cache: tokio::sync::RwLock::new(HashMap::new()),
            pack_cache: tokio::sync::RwLock::new(None),
        }
    }

    fn object_path(&self, oid: &str) -> String {
        format!("{}/objects/{}/{}", self.prefix, &oid[..2], &oid[2..])
    }

    pub async fn get_object(&self, oid: &str) -> Option<Vec<u8>> {
        {
            let cache = self.object_cache.read().await;
            if let Some(data) = cache.get(oid) {
                tracing::debug!("Cache hit for object {}", oid);
                return Some(data.clone());
            }
        }

        let path = self.object_path(oid);
        tracing::debug!("Trying loose object at: {}", path);
        if let Some(data) = self.s3.get_object(&path).await {
            tracing::debug!("Found loose object {} ({} bytes)", oid, data.len());
            let mut cache = self.object_cache.write().await;
            cache.insert(oid.to_string(), data.clone());
            return Some(data);
        }

        tracing::debug!("Trying pack files for object {}", oid);
        if let Some(obj) = self.get_from_pack(oid).await {
            tracing::debug!("Found object {} in pack ({} bytes)", oid, obj.len());
            let mut cache = self.object_cache.write().await;
            cache.insert(oid.to_string(), obj.clone());
            return Some(obj);
        }

        tracing::warn!("Object {} not found", oid);
        None
    }

    pub async fn put_object(&self, oid: &str, data: Vec<u8>) -> Result<(), aws_sdk_s3::Error> {
        let path = self.object_path(oid);
        self.s3.put_object(&path, data.clone()).await?;
        
        let mut cache = self.object_cache.write().await;
        cache.insert(oid.to_string(), data);
        
        Ok(())
    }

    async fn ensure_pack_loaded(&self) -> bool {
        {
            let cache = self.pack_cache.read().await;
            if cache.is_some() {
                return true;
            }
        }

        let pack_dir = format!("{}/objects/pack", self.prefix);
        tracing::debug!("Looking for pack files in: {}", pack_dir);
        let pack_files = self.s3.list_objects(&pack_dir).await;
        tracing::debug!("Found {} files in pack dir", pack_files.len());
        
        for pack_file in &pack_files {
            tracing::debug!("Pack file: {}", pack_file);
            if pack_file.ends_with(".idx") {
                if let Some(idx_data) = self.s3.get_object(pack_file).await {
                    let pack_path = pack_file.replace(".idx", ".pack");
                    if let Some(pack_data) = self.s3.get_object(&pack_path).await {
                        tracing::info!("Loaded pack file: {} ({} bytes idx, {} bytes pack)", 
                            pack_file, idx_data.len(), pack_data.len());
                        let mut cache = self.pack_cache.write().await;
                        *cache = Some(PackCache { pack_data, idx_data });
                        return true;
                    }
                }
            }
        }

        tracing::debug!("No pack files found");
        false
    }

    async fn get_from_pack(&self, oid: &str) -> Option<Vec<u8>> {
        self.ensure_pack_loaded().await;
        
        let cache = self.pack_cache.read().await;
        let pack_cache = cache.as_ref()?;
        
        let target_bytes = hex::decode(oid).ok()?;
        let offset = find_object_in_index(&pack_cache.idx_data, &target_bytes)?;
        
        extract_object_with_deltas(&pack_cache.pack_data, &pack_cache.idx_data, offset)
    }

    pub async fn read_ref(&self, ref_name: &str) -> Option<String> {
        let path = format!("{}/{}", self.prefix, ref_name);
        tracing::debug!("Reading ref from: {}", path);
        let data = self.s3.get_object(&path).await?;
        let content = String::from_utf8(data).ok().map(|s| s.trim().to_string());
        tracing::debug!("Ref {} = {:?}", ref_name, content);
        content
    }

    pub async fn write_ref(&self, ref_name: &str, oid: &str) -> Result<(), aws_sdk_s3::Error> {
        let path = format!("{}/{}", self.prefix, ref_name);
        self.s3.put_object(&path, format!("{}\n", oid).into_bytes()).await
    }

    pub async fn list_refs(&self, prefix: &str) -> Vec<(String, String)> {
        tracing::debug!("Listing refs with prefix: {} (repo prefix: {})", prefix, self.prefix);
        let mut refs = Vec::new();
        
        if let Some(packed) = self.read_packed_refs().await {
            tracing::debug!("Found {} packed refs", packed.len());
            for (ref_name, oid) in packed {
                if ref_name.starts_with(prefix) {
                    refs.push((ref_name, oid));
                }
            }
        }
        
        let path = format!("{}/{}", self.prefix, prefix);
        tracing::debug!("Looking for loose refs at: {}", path);
        let keys = self.s3.list_objects(&path).await;
        tracing::debug!("Found {} loose ref files", keys.len());
        
        for key in keys {
            let ref_name = key.strip_prefix(&format!("{}/", self.prefix)).unwrap_or(&key);
            if let Some(data) = self.s3.get_object(&key).await {
                if let Ok(oid) = String::from_utf8(data) {
                    let oid = oid.trim().to_string();
                    if !refs.iter().any(|(n, _)| n == ref_name) {
                        refs.push((ref_name.to_string(), oid));
                    }
                }
            }
        }
        
        tracing::debug!("Total refs found: {}", refs.len());
        refs
    }
    
    async fn read_packed_refs(&self) -> Option<Vec<(String, String)>> {
        let path = format!("{}/packed-refs", self.prefix);
        let data = self.s3.get_object(&path).await?;
        let content = String::from_utf8(data).ok()?;
        
        let mut refs = Vec::new();
        for line in content.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') || line.starts_with('^') {
                continue;
            }
            let parts: Vec<&str> = line.splitn(2, ' ').collect();
            if parts.len() == 2 {
                let oid = parts[0].to_string();
                let ref_name = parts[1].to_string();
                refs.push((ref_name, oid));
            }
        }
        
        Some(refs)
    }

    pub async fn resolve_ref(&self, ref_name: &str) -> Option<String> {
        self.resolve_ref_inner(ref_name, 0).await
    }

    fn resolve_ref_inner<'a>(&'a self, ref_name: &'a str, depth: u8) -> std::pin::Pin<Box<dyn std::future::Future<Output = Option<String>> + Send + 'a>> {
        Box::pin(async move {
            if depth > 10 {
                return None;
            }

            if let Some(content) = self.read_ref(ref_name).await {
                if content.starts_with("ref: ") {
                    let target = content.strip_prefix("ref: ")?;
                    return self.resolve_ref_inner(target, depth + 1).await;
                }
                
                if content.len() == 40 && content.chars().all(|c| c.is_ascii_hexdigit()) {
                    return Some(content);
                }
            }
            
            if let Some(packed) = self.read_packed_refs().await {
                for (name, oid) in packed {
                    if name == ref_name {
                        return Some(oid);
                    }
                }
            }
            
            None
        })
    }
}

fn find_object_in_index(idx_data: &[u8], target_oid: &[u8]) -> Option<u64> {
    if idx_data.len() < 8 || target_oid.len() != 20 {
        return None;
    }

    let magic = &idx_data[0..4];
    if magic != [0xff, 0x74, 0x4f, 0x63] {
        return None;
    }

    let version = u32::from_be_bytes([idx_data[4], idx_data[5], idx_data[6], idx_data[7]]);
    if version != 2 {
        return None;
    }

    let fanout_start = 8;
    let fanout_end = fanout_start + 256 * 4;
    
    if idx_data.len() < fanout_end {
        return None;
    }

    let total_objects = u32::from_be_bytes([
        idx_data[fanout_end - 4],
        idx_data[fanout_end - 3],
        idx_data[fanout_end - 2],
        idx_data[fanout_end - 1],
    ]) as usize;

    let first_byte = target_oid[0] as usize;
    
    let start_idx = if first_byte == 0 {
        0
    } else {
        let prev_offset = fanout_start + (first_byte - 1) * 4;
        u32::from_be_bytes([
            idx_data[prev_offset],
            idx_data[prev_offset + 1],
            idx_data[prev_offset + 2],
            idx_data[prev_offset + 3],
        ]) as usize
    };
    
    let end_idx = {
        let offset = fanout_start + first_byte * 4;
        u32::from_be_bytes([
            idx_data[offset],
            idx_data[offset + 1],
            idx_data[offset + 2],
            idx_data[offset + 3],
        ]) as usize
    };

    let sha_table_start = fanout_end;
    
    for i in start_idx..end_idx {
        let sha_offset = sha_table_start + i * 20;
        if sha_offset + 20 > idx_data.len() {
            break;
        }
        
        if &idx_data[sha_offset..sha_offset + 20] == target_oid {
            let crc_table_start = sha_table_start + total_objects * 20;
            let offset_table_start = crc_table_start + total_objects * 4;
            let offset_pos = offset_table_start + i * 4;
            
            if offset_pos + 4 > idx_data.len() {
                return None;
            }
            
            let offset = u32::from_be_bytes([
                idx_data[offset_pos],
                idx_data[offset_pos + 1],
                idx_data[offset_pos + 2],
                idx_data[offset_pos + 3],
            ]);
            
            if offset & 0x80000000 != 0 {
                let large_offset_idx = (offset & 0x7fffffff) as usize;
                let large_offset_table_start = offset_table_start + total_objects * 4;
                let large_offset_pos = large_offset_table_start + large_offset_idx * 8;
                
                if large_offset_pos + 8 > idx_data.len() {
                    return None;
                }
                
                return Some(u64::from_be_bytes([
                    idx_data[large_offset_pos],
                    idx_data[large_offset_pos + 1],
                    idx_data[large_offset_pos + 2],
                    idx_data[large_offset_pos + 3],
                    idx_data[large_offset_pos + 4],
                    idx_data[large_offset_pos + 5],
                    idx_data[large_offset_pos + 6],
                    idx_data[large_offset_pos + 7],
                ]));
            }
            
            return Some(offset as u64);
        }
    }
    
    None
}

fn extract_object_with_deltas(pack_data: &[u8], idx_data: &[u8], offset: u64) -> Option<Vec<u8>> {
    let (obj_type, content) = read_pack_object(pack_data, idx_data, offset)?;
    
    let type_str = match obj_type {
        1 => "commit",
        2 => "tree",
        3 => "blob",
        4 => "tag",
        _ => return None,
    };

    let header = format!("{} {}\0", type_str, content.len());
    let mut result = header.into_bytes();
    result.extend(content);
    
    compress_zlib(&result)
}

fn read_pack_object(pack_data: &[u8], idx_data: &[u8], offset: u64) -> Option<(u8, Vec<u8>)> {
    let offset = offset as usize;
    if offset >= pack_data.len() {
        return None;
    }

    let mut pos = offset;
    let first_byte = pack_data[pos];
    pos += 1;

    let obj_type = (first_byte >> 4) & 0x07;
    let mut size = (first_byte & 0x0f) as usize;
    let mut shift = 4;

    while pack_data.get(pos - 1).map(|b| b & 0x80 != 0).unwrap_or(false) && pos < pack_data.len() {
        let byte = pack_data[pos];
        pos += 1;
        size |= ((byte & 0x7f) as usize) << shift;
        shift += 7;
    }

    match obj_type {
        1 | 2 | 3 | 4 => {
            let compressed = &pack_data[pos..];
            let content = decompress_zlib(compressed)?;
            Some((obj_type, content))
        }
        6 => {
            let (base_offset, bytes_read) = read_ofs_delta_offset(&pack_data[pos..])?;
            pos += bytes_read;
            
            let base_abs_offset = offset as u64 - base_offset;
            let (base_type, base_content) = read_pack_object(pack_data, idx_data, base_abs_offset)?;
            
            let compressed = &pack_data[pos..];
            let delta = decompress_zlib(compressed)?;
            
            let result = apply_delta(&base_content, &delta)?;
            Some((base_type, result))
        }
        7 => {
            if pos + 20 > pack_data.len() {
                return None;
            }
            let base_oid = &pack_data[pos..pos + 20];
            pos += 20;
            
            let base_offset = find_object_in_index(idx_data, base_oid)?;
            let (base_type, base_content) = read_pack_object(pack_data, idx_data, base_offset)?;
            
            let compressed = &pack_data[pos..];
            let delta = decompress_zlib(compressed)?;
            
            let result = apply_delta(&base_content, &delta)?;
            Some((base_type, result))
        }
        _ => None,
    }
}

fn read_ofs_delta_offset(data: &[u8]) -> Option<(u64, usize)> {
    if data.is_empty() {
        return None;
    }
    
    let mut offset = (data[0] & 0x7f) as u64;
    let mut pos = 1;
    
    while data.get(pos - 1).map(|b| b & 0x80 != 0).unwrap_or(false) {
        if pos >= data.len() {
            return None;
        }
        offset += 1;
        offset = (offset << 7) | ((data[pos] & 0x7f) as u64);
        pos += 1;
    }
    
    Some((offset, pos))
}

fn apply_delta(base: &[u8], delta: &[u8]) -> Option<Vec<u8>> {
    let mut pos = 0;
    
    let (_src_size, bytes_read) = read_varint(&delta[pos..])?;
    pos += bytes_read;
    
    let (dst_size, bytes_read) = read_varint(&delta[pos..])?;
    pos += bytes_read;
    
    let mut result = Vec::with_capacity(dst_size);
    
    while pos < delta.len() {
        let cmd = delta[pos];
        pos += 1;
        
        if cmd & 0x80 != 0 {
            let mut copy_offset = 0usize;
            let mut copy_size = 0usize;
            
            if cmd & 0x01 != 0 {
                copy_offset |= delta.get(pos).copied().unwrap_or(0) as usize;
                pos += 1;
            }
            if cmd & 0x02 != 0 {
                copy_offset |= (delta.get(pos).copied().unwrap_or(0) as usize) << 8;
                pos += 1;
            }
            if cmd & 0x04 != 0 {
                copy_offset |= (delta.get(pos).copied().unwrap_or(0) as usize) << 16;
                pos += 1;
            }
            if cmd & 0x08 != 0 {
                copy_offset |= (delta.get(pos).copied().unwrap_or(0) as usize) << 24;
                pos += 1;
            }
            
            if cmd & 0x10 != 0 {
                copy_size |= delta.get(pos).copied().unwrap_or(0) as usize;
                pos += 1;
            }
            if cmd & 0x20 != 0 {
                copy_size |= (delta.get(pos).copied().unwrap_or(0) as usize) << 8;
                pos += 1;
            }
            if cmd & 0x40 != 0 {
                copy_size |= (delta.get(pos).copied().unwrap_or(0) as usize) << 16;
                pos += 1;
            }
            
            if copy_size == 0 {
                copy_size = 0x10000;
            }
            
            if copy_offset + copy_size > base.len() {
                return None;
            }
            
            result.extend_from_slice(&base[copy_offset..copy_offset + copy_size]);
        } else if cmd != 0 {
            let insert_size = cmd as usize;
            if pos + insert_size > delta.len() {
                return None;
            }
            result.extend_from_slice(&delta[pos..pos + insert_size]);
            pos += insert_size;
        } else {
            return None;
        }
    }
    
    if result.len() != dst_size {
        return None;
    }
    
    Some(result)
}

fn read_varint(data: &[u8]) -> Option<(usize, usize)> {
    if data.is_empty() {
        return None;
    }
    
    let mut value = 0usize;
    let mut shift = 0;
    let mut pos = 0;
    
    loop {
        if pos >= data.len() {
            return None;
        }
        
        let byte = data[pos];
        pos += 1;
        
        value |= ((byte & 0x7f) as usize) << shift;
        
        if byte & 0x80 == 0 {
            break;
        }
        
        shift += 7;
    }
    
    Some((value, pos))
}

fn decompress_zlib(data: &[u8]) -> Option<Vec<u8>> {
    let mut decoder = flate2::read::ZlibDecoder::new(data);
    let mut result = Vec::new();
    decoder.read_to_end(&mut result).ok()?;
    Some(result)
}

fn compress_zlib(data: &[u8]) -> Option<Vec<u8>> {
    use std::io::Write;
    let mut encoder = flate2::write::ZlibEncoder::new(Vec::new(), flate2::Compression::default());
    encoder.write_all(data).ok()?;
    encoder.finish().ok()
}
