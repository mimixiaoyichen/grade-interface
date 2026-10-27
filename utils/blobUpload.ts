import { upload } from '@vercel/blob/client';

// Uploads a file to Vercel Blob via a server-side token exchange.
// The BLOB_READ_WRITE_TOKEN stays on the server; the browser never sees it.
export const uploadFileToBlob = async (file: File): Promise<string> => {
  const safeName = file.name || 'audio.webm';
  const pathname = `uploads/${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`;

  const blob = await upload(pathname, file, {
    access: 'public',
    handleUploadUrl: '/api/blob-upload-url',
  });

  return blob.url;
};
