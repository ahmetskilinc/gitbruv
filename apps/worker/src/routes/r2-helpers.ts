export async function r2DeletePrefix(bucket: R2Bucket, prefix: string): Promise<void> {
  const keys: string[] = [];
  let cursor: string | undefined;

  do {
    const result = await bucket.list({ prefix, cursor });
    for (const obj of result.objects) {
      keys.push(obj.key);
    }
    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    if (batch.length === 0) continue;

    await Promise.all(batch.map((key) => bucket.delete(key)));
  }
}

