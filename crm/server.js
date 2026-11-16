/**
 * Keystone Overseas — B2B CRM Production Server & API Proxy
 * Supports Cloudflare Pages Function parity, TruecallerJS API & SPA routing
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { lookupNumber, getInstallationId } = require('./scripts/truecaller_lookup');

const app = express();
const PORT = process.env.PORT || 8500;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// System users for PIN auth
const SYSTEM_USERS = {
  '1001': { id: '00000000-0000-0000-0000-000000001001', pin: '1001', name: 'Hasibul Munim (Owner)', role: 'admin', hub: 'ALL', phone: '+8801941646278' },
  '1002': { id: '00000000-0000-0000-0000-000000001002', pin: '1002', name: 'Co-Owner (Admin)', role: 'admin', hub: 'ALL', phone: '+8801941646279' },
  '3001': { id: '00000000-0000-0000-0000-000000003001', pin: '3001', name: 'Caller 1 (Eastern Hub)', role: 'telecaller', hub: 'CALLER_1', phone: '+8801700000002' },
  '3002': { id: '00000000-0000-0000-0000-000000003002', pin: '3002', name: 'Caller 2 (Northern Hub)', role: 'telecaller', hub: 'CALLER_2', phone: '+8801700000003' },
  '3003': { id: '00000000-0000-0000-0000-000000003003', pin: '3003', name: 'Caller 3 (Southern Hub)', role: 'telecaller', hub: 'CALLER_3', phone: '+8801700000004' },
};

// PIN Auth Endpoint
app.post('/api/auth', (req, res) => {
  const pin = String(req.body?.pin || '').trim();
  const user = SYSTEM_USERS[pin];
  if (user) {
    return res.json({ success: true, user });
  }
  return res.status(401).json({ success: false, error: 'Invalid 4-digit PIN' });
});

app.get('/api/auth', (req, res) => {
  res.json({
    users: Object.values(SYSTEM_USERS).map(u => ({ pin: u.pin, name: u.name, role: u.role, hub: u.hub }))
  });
});

// Truecaller Status
app.get('/api/truecaller/status', (req, res) => {
  const id = getInstallationId();
  res.json({
    engine: 'truecallerjs',
    hasInstallationId: Boolean(id),
    installationIdPreview: id ? `${id.substring(0, 6)}...` : null
  });
});

// Truecaller Search Handler
async function handleTruecallerSearch(req, res) {
  const phone = req.query.phone;
  const clientToken = req.query.installationId;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number parameter is required (?phone=...)' });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  let bdPhone = cleanPhone;
  if (bdPhone.startsWith('880')) bdPhone = bdPhone.substring(3);
  else if (bdPhone.startsWith('0')) bdPhone = bdPhone.substring(1);

  const webSearchUrl = `https://www.truecaller.com/search/bd/${bdPhone}`;
  const token = clientToken || getInstallationId();

  if (!token) {
    return res.json({
      success: false,
      fallback: true,
      error: 'TruecallerJS Installation ID not configured. Run "npx truecallerjs login" or view web link.',
      phone,
      webSearchUrl
    });
  }

  try {
    const data = await lookupNumber(phone, token);
    res.json({
      ...data,
      webSearchUrl
    });
  } catch (err) {
    res.json({
      success: false,
      fallback: true,
      error: err.message || String(err),
      phone,
      webSearchUrl
    });
  }
}

app.get('/api/truecaller', handleTruecallerSearch);
app.get('/api/truecaller/search', handleTruecallerSearch);

// Serve Built SPA (dist/) if exists, otherwise serve root
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  app.use(express.static(__dirname));
}

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  🚀 Keystone B2B CRM Redesigned Unified Server Live!`);
    console.log(`  🌐 Unified Application: http://localhost:${PORT}`);
    console.log(`  👤 Truecaller API: http://localhost:${PORT}/api/truecaller/status`);
    console.log(`  🔒 PIN Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
