import { getWorkerUrl } from "./utils";
import { getSession } from "./session";


export async function r2Get(key: string): Promise<Buffer | null> {
  const workerUrl = getWorkerUrl();
  const session = await getSession();
  const headers: HeadersInit = {};

  if (session?.session?.token) {
    headers["Authorization"] = `Bearer ${session.session.token}`;
  }
  
  const response = await fetch(`${workerUrl}/api/r2/${encodeURIComponent(key)}`, {
    method: "GET",
    headers,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to get object: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function r2GetBatch(keys: string[]): Promise<Map<string, Buffer | null>> {
  const workerUrl = getWorkerUrl();
  const session = await getSession();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (session?.session?.token) {
    headers["Authorization"] = `Bearer ${session.session.token}`;
  }
  
  const response = await fetch(`${workerUrl}/api/r2/batch/get`, {
    method: "POST",
    headers,
    body: JSON.stringify({ keys }),
  });

  if (!response.ok) {
    throw new Error(`Failed to batch get objects: ${response.statusText}`);
  }

  const { results } = await response.json() as { results: Record<string, string | null> };
  const map = new Map<string, Buffer | null>();

  for (const [key, value] of Object.entries(results)) {
    if (value === null) {
      map.set(key, null);
    } else {
      const binaryString = atob(value);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      map.set(key, Buffer.from(bytes));
    }
  }

  return map;
}

export async function r2Put(key: string, data: Buffer | Uint8Array | string): Promise<void> {
  const workerUrl = getWorkerUrl();
  const session = await getSession();
  
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  const headers: HeadersInit = {
    "Content-Type": "application/octet-stream",
  };

  if (session?.session?.token) {
    headers["Authorization"] = `Bearer ${session.session.token}`;
  }

  const response = await fetch(`${workerUrl}/api/r2/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers,
    body: buffer,
  });

  if (!response.ok) {
    throw new Error(`Failed to put object: ${response.statusText}`);
  }
}

export async function r2PutBatch(items: Array<{ key: string; data: Buffer | Uint8Array | string }>): Promise<void> {
  const workerUrl = getWorkerUrl();
  const session = await getSession();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (session?.session?.token) {
    headers["Authorization"] = `Bearer ${session.session.token}`;
  }
  
  const payload = items.map((item) => {
    const buffer = typeof item.data === "string" ? Buffer.from(item.data) : Buffer.from(item.data);
    const binaryString = buffer.toString("binary");
    const base64 = btoa(binaryString);
    return {
      key: item.key,
      data: base64,
      contentType: "application/octet-stream",
    };
  });

  const response = await fetch(`${workerUrl}/api/r2/batch/put`, {
    method: "POST",
    headers,
    body: JSON.stringify({ items: payload }),
  });

  if (!response.ok) {
    throw new Error(`Failed to batch put objects: ${response.statusText}`);
  }
}

export async function r2Delete(key: string): Promise<void> {
  const workerUrl = getWorkerUrl();
  const session = await getSession();
  const headers: HeadersInit = {};

  if (session?.session?.token) {
    headers["Authorization"] = `Bearer ${session.session.token}`;
  }
  
  const response = await fetch(`${workerUrl}/api/r2/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to delete object: ${response.statusText}`);
  }
}

export async function r2Head(key: string): Promise<{ exists: boolean; size?: number }> {
  const workerUrl = getWorkerUrl();
  const session = await getSession();
  const headers: HeadersInit = {};

  if (session?.session?.token) {
    headers["Authorization"] = `Bearer ${session.session.token}`;
  }
  
  const response = await fetch(`${workerUrl}/api/r2/${encodeURIComponent(key)}`, {
    method: "HEAD",
    headers,
  });

  if (response.status === 404) {
    return { exists: false };
  }

  if (!response.ok) {
    throw new Error(`Failed to head object: ${response.statusText}`);
  }

  const contentLength = response.headers.get("Content-Length");
  return {
    exists: true,
    size: contentLength ? parseInt(contentLength, 10) : undefined,
  };
}

export async function r2Exists(key: string): Promise<boolean> {
  const result = await r2Head(key);
  return result.exists;
}

export async function r2List(prefix: string): Promise<string[]> {
  const workerUrl = getWorkerUrl();
  const session = await getSession();
  const headers: HeadersInit = {};

  if (session?.session?.token) {
    headers["Authorization"] = `Bearer ${session.session.token}`;
  }
  
  const response = await fetch(`${workerUrl}/api/r2/list/${encodeURIComponent(prefix)}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to list objects: ${response.statusText}`);
  }

  const { keys } = await response.json() as { keys: string[] };
  return keys;
}

export async function r2DeletePrefix(prefix: string): Promise<void> {
  const workerUrl = getWorkerUrl();
  const session = await getSession();
  const headers: HeadersInit = {};

  if (session?.session?.token) {
    headers["Authorization"] = `Bearer ${session.session.token}`;
  }
  
  const response = await fetch(`${workerUrl}/api/r2/prefix/${encodeURIComponent(prefix)}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to delete prefix: ${response.statusText}`);
  }
}

