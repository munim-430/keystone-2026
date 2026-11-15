#!/usr/bin/env node
/**
 * Keystone Overseas — TruecallerJS Lookup & Enrichment Engine
 * Powered by open-source: https://github.com/sumithemmadi/truecallerjs
 * 
 * Usage:
 *   node scripts/truecaller_lookup.js +8801711004605
 *   node scripts/truecaller_lookup.js 01711283634 --json
 *   node scripts/truecaller_lookup.js --enrich
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const truecallerjs = require('truecallerjs');

// Auto-detect installationId
function getInstallationId() {
  // 1. From CLI flag
  const args = process.argv.slice(2);
  const idIndex = args.indexOf('--id');
  if (idIndex !== -1 && args[idIndex + 1]) {
    return args[idIndex + 1].trim();
  }

  // 2. From Environment Variable
  if (process.env.TRUECALLER_INSTALLATION_ID) {
    return process.env.TRUECALLER_INSTALLATION_ID.trim();
  }

  // 3. From default truecallerjs auth file (~/.config/truecallerjs/authkey.json)
  const authKeyPath = path.join(os.homedir(), '.config', 'truecallerjs', 'authkey.json');
  if (fs.existsSync(authKeyPath)) {
    try {
      const authData = JSON.parse(fs.readFileSync(authKeyPath, 'utf8'));
      if (authData && authData.installationId) {
        return authData.installationId.trim();
      }
    } catch (e) {
      // ignore
    }
  }

  // 4. From local crm .env.local
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    try {
      const content = fs.readFileSync(envLocalPath, 'utf8');
      const match = content.match(/TRUECALLER_INSTALLATION_ID=["']?([^"'\r\n]+)/);
      if (match && match[1]) return match[1].trim();
    } catch (e) {
      // ignore
    }
  }

  return null;
}

// Clean Bangladesh phone numbers
function normalizeBdPhone(phone) {
  if (!phone) return null;
  let clean = phone.replace(/[^0-9+]/g, '');
  if (clean.startsWith('+880')) {
    clean = clean.substring(4);
  } else if (clean.startsWith('880')) {
    clean = clean.substring(3);
  } else if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  return clean.length >= 10 ? `+880${clean}` : null;
}

async function lookupNumber(number, installationId) {
  const e164 = normalizeBdPhone(number) || number;
  const searchData = {
    number: e164,
    countryCode: 'BD',
    installationId: installationId
  };

  try {
    const res = await truecallerjs.search(searchData);
    return {
      success: true,
      query: number,
      e164: e164,
      name: res.getName() || null,
      altName: res.getAlternateName() || null,
      email: res.getEmailId() || null,
      addresses: res.getAddresses() || [],
      countryDetails: res.getCountryDetails() || null,
      raw: res.json(false)
    };
  } catch (err) {
    return {
      success: false,
      query: number,
      e164: e164,
      error: err.message || String(err)
    };
  }
}

async function runEnrichment(installationId, targetFile) {
  const filePath = targetFile || path.join(__dirname, '..', 'all_bangladesh_centers.json');
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Data file not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`📂 Loading centers from: ${filePath}`);
  const centers = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`📊 Total centers in dataset: ${centers.length}`);

  let enrichedCount = 0;
  for (let i = 0; i < centers.length; i++) {
    const c = centers[i];
    if (c.phone && !c.directorName) {
      console.log(`[${i + 1}/${centers.length}] Querying ${c.name} (${c.phone})...`);
      const res = await lookupNumber(c.phone, installationId);
      if (res.success && res.name) {
        c.directorName = res.name;
        if (res.altName) c.directorAltName = res.altName;
        enrichedCount++;
        console.log(`   ✅ Found Name: "${res.name}"`);
      } else {
        console.log(`   ⚠️ No name found or rate limited: ${res.error || 'Empty result'}`);
      }
      // Polite throttle (1.5s delay to avoid Truecaller rate limiting)
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  const outPath = path.join(__dirname, '..', 'all_bangladesh_centers_truecaller_enriched.json');
  fs.writeFileSync(outPath, JSON.stringify(centers, null, 2));
  console.log(`\n🎉 Enrichment Complete! Enriched ${enrichedCount} centers with verified Truecaller names.`);
  console.log(`💾 Saved to: ${outPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes('--json');
  const isEnrich = args.includes('--enrich');
  const phoneArg = args.find(a => !a.startsWith('--') && a !== args[args.indexOf('--id') + 1]);

  const installationId = getInstallationId();

  if (!installationId) {
    console.error(`
❌ TruecallerJS Installation ID Not Found!
------------------------------------------------------------------------
To use open-source TruecallerJS (https://github.com/sumithemmadi/truecallerjs):

1. Generate your personal Truecaller Installation ID via CLI:
   npx truecallerjs login

2. View your installation ID:
   npx truecallerjs -i

3. Pass it to this script:
   node scripts/truecaller_lookup.js <phone> --id <INSTALLATION_ID>
   or set it in your environment:
   export TRUECALLER_INSTALLATION_ID=<INSTALLATION_ID>
------------------------------------------------------------------------
    `);
    process.exit(1);
  }

  if (isEnrich) {
    await runEnrichment(installationId);
    return;
  }

  if (!phoneArg) {
    console.log(`
Usage:
  node scripts/truecaller_lookup.js <phoneNumber> [--json] [--id <token>]
  node scripts/truecaller_lookup.js --enrich

Examples:
  node scripts/truecaller_lookup.js +8801711004605
  node scripts/truecaller_lookup.js 01711283634 --json
    `);
    process.exit(0);
  }

  const result = await lookupNumber(phoneArg, installationId);

  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('\n======================================================');
    console.log('       KEYSTONE B2B — TRUECALLERJS LOOKUP             ');
    console.log('       Engine: github.com/sumithemmadi/truecallerjs   ');
    console.log('======================================================');
    console.log(`📞 Phone Number : ${result.query} (${result.e164})`);
    if (result.success) {
      console.log(`👤 Name         : ${result.name || 'Not Available'}`);
      if (result.altName) console.log(`🏷️ Alt Name     : ${result.altName}`);
      if (result.email) console.log(`✉️ Email        : ${result.email}`);
      if (result.addresses && result.addresses.length > 0) {
        console.log(`📍 Location     : ${result.addresses.map(a => `${a.city || ''} (${a.countryCode || ''})`).join(', ')}`);
      }
    } else {
      console.log(`❌ Error        : ${result.error}`);
    }
    console.log('======================================================\n');
  }
}

if (require.main === module) {
  main();
}

module.exports = { lookupNumber, normalizeBdPhone, getInstallationId };
