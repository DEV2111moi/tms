// Nadar TMHNU TMS Server - reloaded with clean deduplicated fleet views
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

// Root route: redirect browser to the frontend UI
app.get('/', (req, res) => {
  const host = req.hostname || 'localhost';
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Nadar TMS API</title>
        <meta http-equiv="refresh" content="2;url=http://${host}:5173" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f172a; color: #ffffff; text-align: center; }
          .card { background: #1e293b; padding: 36px 48px; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155; }
          h2 { margin: 0 0 10px; color: #38bdf8; font-size: 24px; }
          p { color: #94a3b8; font-size: 14px; margin: 0 0 24px; }
          a { display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: bold; font-size: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>⚡ Nadar TMS Backend API Active</h2>
          <p>Redirecting you to the Web Application...</p>
          <a href="http://${host}:5173">👉 Open Nadar TMS (http://${host}:5173)</a>
        </div>
      </body>
    </html>
  `);
});

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
  console.log('\n  ======================================================');
  console.log('  ⚡ Nadar TMS System Online');
  console.log('  ------------------------------------------------------');
  console.log('  🌐 Web App (Browser):');
  console.log('     Local  : http://localhost:5173');
  lan.forEach((ip) => console.log('     Network: http://' + ip + ':5173 (Open on phone/laptop)'));
  console.log('  ⚙️  Backend API:');
  console.log('     Local  : http://localhost:' + PORT + '/api/health');
  lan.forEach((ip) => console.log('     Network: http://' + ip + ':' + PORT + '/api/health'));
  console.log('  ======================================================\n');
});
// Reloaded: 2026-09-07T23:26:15
