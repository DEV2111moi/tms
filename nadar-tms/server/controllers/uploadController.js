const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) {}

// POST /api/upload — accept base64 data URL, save to /uploads/
exports.upload = (req, res) => {
  try {
    const { name, data } = req.body || {};
    if (!data) return res.status(400).json({ error: 'No file data received.' });
    const m = /^data:([^;]+);base64,(.+)$/.exec(data);
    const b64 = m ? m[2] : data;
    const buf = Buffer.from(b64, 'base64');
    if (buf.length > 5 * 1024 * 1024) return res.status(413).json({ error: 'File too large (max 5 MB).' });
    const safe = (name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-40);
    const fname = Date.now() + '_' + safe;
    fs.writeFileSync(path.join(uploadDir, fname), buf);
    res.status(201).json({ path: '/uploads/' + fname });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Upload failed.' }); }
};
