/**
 * Keystone Overseas — B2B CRM Local Server & TruecallerJS API
 * Open Source Integration: https://github.com/sumithemmadi/truecallerjs
 */

const express = require('express');
const path = require('path');
const { lookupNumber, getInstallationId } = require('./scripts/truecaller_lookup');

const app = express();
const PORT = process.env.PORT || 8500;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve CRM Static Files
app.use(express.static(__dirname));

// TruecallerJS Status Endpoint
app.get('/api/truecaller/status', (req, res) => {
  const id = getInstallationId();
  res.json({
    engine: 'truecallerjs',
    repository: 'https://github.com/sumithemmadi/truecallerjs',
    hasInstallationId: Boolean(id),
    installationIdPreview: id ? `${id.substring(0, 6)}...` : null
  });
});

// TruecallerJS Search Endpoint
app.get('/api/truecaller/search', async (req, res) => {
  const phone = req.query.phone;
  const clientToken = req.query.installationId;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number parameter is required (?phone=...)' });
  }

  const token = clientToken || getInstallationId();

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'TruecallerJS Installation ID not configured. Run "npx truecallerjs login" or provide installationId parameter.'
    });
  }

  try {
    const data = await lookupNumber(phone, token);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🚀 Keystone B2B CRM & TruecallerJS Server Live!`);
  console.log(`  🌐 Dashboard: http://localhost:${PORT}/owner.html`);
  console.log(`  📱 Employee CRM: http://localhost:${PORT}/index.html`);
  console.log(`  👤 TruecallerJS API: http://localhost:${PORT}/api/truecaller/status`);
  console.log(`======================================================\n`);
});
