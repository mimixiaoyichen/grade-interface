import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createPresignedUploadURL } from '@vercel/blob';

// Returns a single-use presigned upload URL for Vercel Blob.
// Requires BLOB_READ_WRITE_TOKEN set in the environment.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileName = 'audio.webm', contentType = 'audio/webm' } = req.body || {};
    const { url } = await createPresignedUploadURL({
      access: 'private',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // The final blob URL is url.split('?')[0]
    res.status(200).json({ uploadUrl: url, blobUrl: url.split('?')[0], fileName });
  } catch (err: any) {
    console.error('blob-upload-url error', err);
    res.status(500).json({ error: err?.message || 'Failed to create upload URL' });
  }
}
