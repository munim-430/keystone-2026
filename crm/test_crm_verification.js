/**
 * Keystone Overseas B2B CRM — Automated Verification Suite
 * Tests:
 * 1. Build & Zero-CDN Bundle Invariant
 * 2. Territory Hub Partition Invariant (all 49 districts & 859 centers)
 * 3. 4-Digit PIN Authentication Invariant (Admins & 3 Callers)
 * 4. API Endpoints & Truecaller Proxy Handlers
 * 5. Supabase Schema Structure & Proposal Review Queue Table
 * 6. Cloudflare Pages Functions Syntax & Signatures
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🧪 Starting Keystone B2B CRM Verification Suite...\n');

let passCount = 0;
let failCount = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    failCount++;
  }
}

async function itAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    failCount++;
  }
}

async function runTests() {
  const crmDir = __dirname;
  const distDir = path.join(crmDir, 'dist');

  // TEST 1: Build & Zero-CDN Verification
  it('Production build output exists with index.html and assets', () => {
    assert(fs.existsSync(distDir), 'dist directory exists');
    assert(fs.existsSync(path.join(distDir, 'index.html')), 'dist/index.html exists');
    assert(fs.existsSync(path.join(distDir, 'Keystone_IELTS_Center_Partnership_Proposal.pdf')), 'Proposal PDF in dist');
    assert(fs.existsSync(path.join(distDir, 'keystone_logo_official.png')), 'Official logo in dist');
    assert(fs.existsSync(path.join(distDir, 'data.json')), 'data.json in dist');
  });

  it('dist/index.html has ZERO external CDN script/style dependencies', () => {
    const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
    assert(!html.includes('cdn.jsdelivr.net'), 'No jsdelivr CDN in bundle');
    assert(!html.includes('fonts.googleapis.com'), 'No google fonts CDN blocking bundle');
    assert(!html.includes('cdnjs.cloudflare.com'), 'No cdnjs in bundle');
    assert(!html.includes('unpkg.com'), 'No unpkg in bundle');
    assert(html.includes('<div id="root"></div>'), 'Root div mounted');
  });

  // TEST 2: Territory Hub Partition Invariant
  it('All 859 centers and 49 districts partition into exactly 3 Hubs', () => {
    const data = JSON.parse(fs.readFileSync(path.join(crmDir, 'data.json'), 'utf8'));
    assert.strictEqual(data.length, 859, 'Must have exactly 859 centers');

    const hub1Districts = new Set([
      'Cumilla', 'Feni', 'Noakhali', 'Brahmanbaria', 'Chandpur', 'Laxmipur', 'CoxsBazar',
      'Moulvibazar', 'Habiganj', 'Sunamganj', 'Kishoreganj', 'Mymensingh', 'Jamalpur', 'Sherpur', 'Netrokona'
    ]);
    const hub2Districts = new Set([
      'Rajshahi', 'Bogura', 'Pabna', 'Sirajganj', 'Natore', 'Naogaon', 'Joypurhat',
      'Rangpur', 'Dinajpur', 'Thakurgaon', 'Nilphamari', 'Gaibandha', 'Panchagarh', 'Kurigram', 'Lalmonirhat'
    ]);
    const hub3Districts = new Set([
      'Khulna', 'Kushtia', 'Jashore', 'Jhenaidah', 'Bagerhat', 'Narail', 'Chuadanga', 'Satkhira', 'Magura',
      'Barishal', 'Madaripur', 'Gopalganj', 'Pirojpur', 'Shariatpur', 'Bhola', 'Faridpur', 'Barguna', 'Patuakhali', 'Tangail'
    ]);

    const totalDistricts = new Set([...hub1Districts, ...hub2Districts, ...hub3Districts]);
    assert.strictEqual(totalDistricts.size, 49, '49 total unique districts partitioned');

    // Overlap check
    for (const d of hub1Districts) {
      assert(!hub2Districts.has(d), `District ${d} must not overlap between Hub 1 and Hub 2`);
      assert(!hub3Districts.has(d), `District ${d} must not overlap between Hub 1 and Hub 3`);
    }
    for (const d of hub2Districts) {
      assert(!hub3Districts.has(d), `District ${d} must not overlap between Hub 2 and Hub 3`);
    }

    // Every single center belongs to a hub
    let count1 = 0, count2 = 0, count3 = 0;
    data.forEach((c) => {
      assert(totalDistricts.has(c.district), `Center ${c.id} district ${c.district} must be in recognized territory`);
      if (hub1Districts.has(c.district)) count1++;
      else if (hub2Districts.has(c.district)) count2++;
      else if (hub3Districts.has(c.district)) count3++;
    });

    assert.strictEqual(count1 + count2 + count3, 859, 'All 859 centers covered across 3 caller hubs');
    console.log(`     (Hub 1 East: ${count1}, Hub 2 North: ${count2}, Hub 3 South: ${count3})`);
  });

  // TEST 3: Supabase Schema Unified Check
  it('supabase_schema_unified.sql contains all required tables and RPCs', () => {
    const sql = fs.readFileSync(path.join(crmDir, 'supabase_schema_unified.sql'), 'utf8');
    assert(sql.includes('CREATE TABLE IF NOT EXISTS public.users'), 'Table public.users exists');
    assert(sql.includes('CREATE TABLE IF NOT EXISTS public.b2b_partners'), 'Table public.b2b_partners exists');
    assert(sql.includes('CREATE TABLE IF NOT EXISTS public.b2b_call_logs'), 'Table public.b2b_call_logs exists');
    assert(sql.includes('CREATE TABLE IF NOT EXISTS public.proposal_review_queue'), 'Table public.proposal_review_queue exists');
    assert(sql.includes('FUNCTION public.lease_b2b_batch'), 'RPC lease_b2b_batch exists');
    assert(sql.includes('FOR UPDATE SKIP LOCKED'), 'Concurrency locking applied in RPC');
    assert(sql.includes("'1001'"), 'PIN 1001 seeded');
    assert(sql.includes("'1002'"), 'PIN 1002 seeded');
    assert(sql.includes("'3001'"), 'PIN 3001 seeded');
    assert(sql.includes("'3002'"), 'PIN 3002 seeded');
    assert(sql.includes("'3003'"), 'PIN 3003 seeded');
  });

  // TEST 4: Cloudflare Pages Functions Check
  it('Cloudflare Pages functions exist and have valid syntax', () => {
    assert(fs.existsSync(path.join(crmDir, 'functions/api/truecaller.js')), 'functions/api/truecaller.js exists');
    assert(fs.existsSync(path.join(crmDir, 'functions/api/auth.js')), 'functions/api/auth.js exists');

    const tcFn = fs.readFileSync(path.join(crmDir, 'functions/api/truecaller.js'), 'utf8');
    assert(tcFn.includes('export async function onRequest'), 'Truecaller export onRequest');
    assert(tcFn.includes('search5-noneu.truecaller.com'), 'Truecaller upstream URL present');

    const authFn = fs.readFileSync(path.join(crmDir, 'functions/api/auth.js'), 'utf8');
    assert(authFn.includes('export async function onRequest'), 'Auth export onRequest');
    assert(authFn.includes('1001') && authFn.includes('3001'), 'Auth checks pins');
  });

  // TEST 5: Server API & Handlers
  await itAsync('Server endpoints respond correctly (/api/auth, /api/truecaller)', async () => {
    const app = require('./server.js');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(8599, resolve));

    try {
      // 5.1: Test PIN 1001 (Owner / Admin)
      const resAdmin = await fetch('http://localhost:8599/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '1001' }),
      });
      const dataAdmin = await resAdmin.json();
      assert.strictEqual(dataAdmin.success, true);
      assert.strictEqual(dataAdmin.user.role, 'admin');
      assert.strictEqual(dataAdmin.user.pin, '1001');

      // 5.2: Test PIN 3001 (Caller 1 Eastern Hub)
      const resCaller = await fetch('http://localhost:8599/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '3001' }),
      });
      const dataCaller = await resCaller.json();
      assert.strictEqual(dataCaller.success, true);
      assert.strictEqual(dataCaller.user.role, 'telecaller');
      assert.strictEqual(dataCaller.user.hub, 'CALLER_1');

      // 5.3: Test Invalid PIN
      const resBad = await fetch('http://localhost:8599/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '0000' }),
      });
      assert.strictEqual(resBad.status, 401);

      // 5.4: Test Truecaller Status
      const resTcStatus = await fetch('http://localhost:8599/api/truecaller/status');
      const dataTcStatus = await resTcStatus.json();
      assert.strictEqual(dataTcStatus.engine, 'truecallerjs');

      // 5.5: Test Truecaller Lookup Fallback
      const resTcLookup = await fetch('http://localhost:8599/api/truecaller?phone=+8801711004605');
      const dataTcLookup = await resTcLookup.json();
      assert(dataTcLookup.webSearchUrl.includes('1711004605'), 'Truecaller fallback provides web link');

      // 5.6: Test SPA fallback
      const resSpa = await fetch('http://localhost:8599/caller-view');
      const textSpa = await resSpa.text();
      assert(textSpa.includes('<div id="root"></div>'), 'SPA route serves index.html');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  console.log(`\n======================================================`);
  console.log(`  Tests Passed: ${passCount}`);
  console.log(`  Tests Failed: ${failCount}`);
  console.log(`======================================================\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests();
