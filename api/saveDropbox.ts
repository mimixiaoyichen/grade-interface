import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    const token = process.env.DROPBOX_ACCESS_TOKEN;
    if (token) return res.status(204).end();
    return res.status(500).json({ error: 'DROPBOX_ACCESS_TOKEN is missing on the server.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.DROPBOX_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'DROPBOX_ACCESS_TOKEN is missing on the server.' });
  }

  const { filename, content } = req.body || {};
  if (!filename || !content) {
    return res.status(400).json({ error: 'filename and content are required.' });
  }

  try {
    const path = `/${filename}`;
    const upload = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path,
          mode: 'add',
          autorename: true,
          mute: false,
        })
      },
      body: content
    });

    if (!upload.ok) {
      const text = await upload.text();
      return res.status(upload.status).json({ error: `Dropbox upload failed: ${upload.statusText}`, detail: text });
    }

    const data = await upload.json();
    return res.status(200).json({ path: data.path_display || path });
  } catch (e: any) {
    console.error('Dropbox upload error:', e);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
