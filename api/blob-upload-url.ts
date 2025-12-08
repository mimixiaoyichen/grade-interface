import type { VercelRequest, VercelResponse } from '@vercel/node';
// NOTE: Not used when uploading directly from the client with a token. Kept for reference.
// import { createUploadURL } from '@vercel/blob';

// Returns a single-use presigned upload URL for Vercel Blob.
// Requires BLOB_READ_WRITE_TOKEN set in the environment.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN is not set on the server.' });
    }

    // Legacy: we’re not issuing upload URLs anymore since client uploads directly with token.
    return res.status(400).json({ error: 'Direct upload URL is disabled. Use client-side token-based upload.' });
  } catch (err: any) {
    console.error('blob-upload-url error', { message: err?.message, stack: err?.stack, tokenSet: Boolean(process.env.BLOB_READ_WRITE_TOKEN) });
    res.status(500).json({ error: err?.message || 'Failed to create upload URL' });
  }
}
