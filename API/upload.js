import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error parsing file', details: err.message });
    if (!files.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      const fileData = fs.readFileSync(files.file.filepath);

      const response = await fetch('https://api.nft.storage/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NFT_KEY}`
        },
        body: fileData
      });

      const data = await response.json();

      if (data.ok && data.value.cid) {
        const cid = data.value.cid;
        const url = `https://ipfs.io/ipfs/${cid}/${files.file.originalFilename}`;
        return res.status(200).json({ url, cid });
      } else {
        return res.status(500).json({ error: 'NFT.Storage upload failed', details: data });
      }
    } catch (e) {
      return res.status(500).json({ error: 'Server error', details: e.message });
    }
  });
}
