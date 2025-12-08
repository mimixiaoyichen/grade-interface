import { createPresignedUploadURL } from '@vercel/blob';

// Fallback: call our API route if direct token not available client-side
export const uploadFileToBlob = async (file: File, token?: string): Promise<string> => {
  // Prefer server-generated presigned URL
  const resp = await fetch('/api/blob-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream' })
  });
  if (!resp.ok) {
    throw new Error(`Failed to get upload URL: ${resp.statusText}`);
  }
  const { uploadUrl, blobUrl } = await resp.json();

  const putResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file
  });
  if (!putResp.ok) {
    throw new Error(`Blob upload failed: ${putResp.status} ${putResp.statusText}`);
  }
  return blobUrl || uploadUrl.split('?')[0];
};
