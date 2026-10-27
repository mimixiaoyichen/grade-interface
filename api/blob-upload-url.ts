import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

// Server-side handler for Vercel Blob client uploads.
// Issues a scoped, one-time upload token so BLOB_READ_WRITE_TOKEN never reaches the browser.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN is not configured on the server.' });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body as HandleUploadBody,
      request: req as any,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname: string) => ({
        allowedContentTypes: ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg', 'application/octet-stream'],
        maximumSizeInBytes: 200 * 1024 * 1024, // 200 MB
        tokenPayload: JSON.stringify({ pathname }),
      }),
      onUploadCompleted: async () => {
        // No-op: cleanup happens after transcription
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (err: any) {
    console.error('blob-upload-url error', err?.message);
    return res.status(500).json({ error: err?.message || 'Failed to handle upload' });
  }
}
