require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRouter = require('./routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api', apiRouter);
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'nadar-tms' }));

// Serve uploaded files
const uploadDir = path.join(__dirname, '..', 'uploads');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) {}
app.use('/uploads', express.static(uploadDir));

// Unknown API routes → clear JSON 404
app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route: ' + req.method + ' ' + req.originalUrl }));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const nets = os.networkInterfaces();
  const lan = [];
  for (const name of Object.keys(nets))
    for (const ni of nets[name] || [])
      if (ni.family === 'IPv4' && !ni.internal) lan.push(ni.address);
  console.log('\n  Nadar TMS backend running');
  console.log('  Local  : http://localhost:' + PORT + '/api/health');
  lan.forEach((ip) => console.log('  Network: http://' + ip + ':' + PORT + '/'));
  console.log('');
});
