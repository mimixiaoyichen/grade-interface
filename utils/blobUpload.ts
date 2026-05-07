import { put } from '@vercel/blob';

// Direct client upload to Vercel Blob (requires exposing a read/write token to the client).
// Set VITE_BLOB_READ_WRITE_TOKEN in your env. This is not recommended for sensitive stores.
export const uploadFileToBlob = async (file: File): Promise<string> => {
  const token = (import.meta as any).env?.VITE_BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('VITE_BLOB_READ_WRITE_TOKEN is not set. Add it to your env to enable uploads.');
  }

  const safeName = file.name || 'audio.webm';
  const pathname = `uploads/${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`;

  const blob = await put(pathname, file, {
    access: 'public',
    contentType: file.type || 'application/octet-stream',
    token,
  });

  return blob.url;
};
