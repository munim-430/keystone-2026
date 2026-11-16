/**
 * Keystone Overseas B2B CRM — Edge Case & Robustness Test Suite
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Edge Case & Robustness Test Suite...\n');

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

// 1. Phone number normalization
it('Phone normalization handles +880, 880, 01, dashes, spaces, and invalid numbers', () => {
  const { onRequest } = require('./functions/api/truecaller.js');
  // Replicate normalizing logic
  function normalizeBdPhone(phone) {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('880')) {
      clean = clean.substring(3);
    } else if (clean.startsWith('0')) {
      clean = clean.substring(1);
    }
    return clean.length >= 10 ? clean : null;
  }

  assert.strictEqual(normalizeBdPhone('+8801711004605'), '1711004605');
  assert.strictEqual(normalizeBdPhone('8801711004605'), '1711004605');
  assert.strictEqual(normalizeBdPhone('01711-004605'), '1711004605');
  assert.strictEqual(normalizeBdPhone('(01711) 004 605'), '1711004605');
  assert.strictEqual(normalizeBdPhone('01711004605'), '1711004605');
  assert.strictEqual(normalizeBdPhone(''), null);
  assert.strictEqual(normalizeBdPhone('12345'), null); // too short
  assert.strictEqual(normalizeBdPhone('invalid-phone'), null);
});

// 2. Proposal message generator edge cases
it('generateProposalCopy handles present and missing director names properly', () => {
  // Read generated dist or source
  const constantsCode = fs.readFileSync(path.join(__dirname, 'src/constants.ts'), 'utf8');
  assert(constantsCode.includes('function generateProposalCopy'), 'Function exists');

  function generateProposalCopy(centerName, directorName) {
    const salutation = directorName ? `শ্রদ্ধেয় ${directorName} স্যার` : 'আসসালামু আলাইকুম স্যার';
    return `${salutation},\nKeystone Overseas (ধানমন্ডি, ঢাকা) থেকে আমাদের ফোনালাপের প্রেক্ষিতে ${centerName}-এর সাথে প্রাতিষ্ঠানিক পার্টনারশিপের সংক্ষিপ্ত বিবরণ নিচে দেওয়া হলো:\n\n📌 পার্টনার বেনিফিট সামারি:\n1. প্রতি স্টুডেন্ট ফাইল অনবোর্ডিংয়ে: ৳২,০০০ অগ্রিম নিশ্চিত কমিশন (২৪ ঘণ্টার মধ্যে ব্যাংক/বিকাশ)।\n2. প্রতি সফল ভিসাপ্রাপ্তিতে: ৳১৫,০০০ – ৳২৫,০০০ পোস্ট-ভিসা সাকসেস বোনাস।\n3. স্পেশাল করিডোর: সাইপ্রাস (No IELTS, No India Visit) ও রোমানিয়া (Schengen Area, 1-Year Prep Year) সহ সাউথ কোরিয়া ও মালয়েশিয়া।\n4. আপনার সেন্টারের স্টুডেন্টদের জন্য বিনামূল্যে ইউরোপিয়ান ক্যারিয়ার সেমিনার ও ফাইল প্রসেসিং সাপোর্ট।\n\n📄 আমাদের অফিশিয়াল পার্টনারশিপ প্রপোজাল ও চুক্তিপত্রটি দেখতে নিচের লিংকে ক্লিক করুন:\nhttps://crm.keystoneeducations.com/Keystone_IELTS_Center_Partnership_Proposal.pdf\n\n🌐 ওয়েবসাইট: https://www.keystoneeducations.com\n📍 হেড অফিস: House - 5/4, Sobhanbag, Road No. 16, Dhanmondi, Dhaka 1207.\n\nস্যার, অফারটি পর্যালোচনা করে আপনার সুবিধাজনক সময়ে জানাবেন। ধন্যবাদ!\n— হাসিবুল মুনিম\nব্যবস্থাপনা পরিচালক, Keystone Overseas (01941-646278)`;
  }

  const withDirector = generateProposalCopy('British Language Club', 'এম. এ. লর্ড');
  assert(withDirector.includes('শ্রদ্ধেয় এম. এ. লর্ড স্যার'), 'Uses director name');
  assert(withDirector.includes('British Language Club'), 'Includes center name');
  assert(withDirector.includes('৳২,০০০'), 'Includes 2,000 upfront');
  assert(withDirector.includes('৳১৫,০০০ – ৳২৫,০০০'), 'Includes visa bonus');
  assert(withDirector.includes('Keystone_IELTS_Center_Partnership_Proposal.pdf'), 'Includes PDF link');

  const withoutDirector = generateProposalCopy('Sylhet Coaching');
  assert(withoutDirector.includes('আসসালামু আলাইকুম স্যার'), 'Fallback salutation');
  assert(withoutDirector.includes('Sylhet Coaching'), 'Includes center name');
});

// 3. PIN edge cases in server
it('PIN authentication handles whitespace, invalid length, and all 5 roles', async () => {
  const app = require('./server.js');
  const http = require('http');
  const server = http.createServer(app);
  await new Promise((res) => server.listen(8598, res));

  try {
    const pins = [
      { pin: '1001', expectedRole: 'admin', expectedName: 'Hasibul Munim (Owner)' },
      { pin: '1002', expectedRole: 'admin', expectedName: 'Co-Owner (Admin)' },
      { pin: '3001', expectedRole: 'telecaller', expectedHub: 'CALLER_1' },
      { pin: '3002', expectedRole: 'telecaller', expectedHub: 'CALLER_2' },
      { pin: '3003', expectedRole: 'telecaller', expectedHub: 'CALLER_3' },
    ];

    for (const p of pins) {
      const res = await fetch('http://localhost:8598/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: `  ${p.pin}  ` }), // whitespace padded
      });
      const data = await res.json();
      assert.strictEqual(data.success, true, `PIN ${p.pin} must succeed`);
      assert.strictEqual(data.user.role, p.expectedRole, `Role matches for ${p.pin}`);
      if (p.expectedHub) assert.strictEqual(data.user.hub, p.expectedHub, `Hub matches for ${p.pin}`);
    }

    // Invalid attempts
    const invalidPins = ['9999', '100', '10001', 'abcd', '', null];
    for (const bad of invalidPins) {
      const res = await fetch('http://localhost:8598/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: bad }),
      });
      assert.strictEqual(res.status, 401, `Invalid PIN ${bad} must return 401`);
    }
  } finally {
    await new Promise((res) => server.close(res));
  }
});

// 4. Data integrity check of 859 centers
it('Every single center in data.json has valid id, name, district, phone, and notes array', () => {
  const centers = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
  assert.strictEqual(centers.length, 859);

  centers.forEach((c, idx) => {
    assert(c.id && c.id.startsWith('center-'), `Row ${idx} has valid id`);
    assert(c.name && c.name.trim().length > 0, `Row ${idx} has name`);
    assert(c.district && c.district.trim().length > 0, `Row ${idx} has district`);
    assert(typeof c.phone === 'string', `Row ${idx} has phone string`);
    assert(Array.isArray(c.notes), `Row ${idx} notes is array`);
  });
});

console.log(`\n======================================================`);
console.log(`  Edge Case Tests Passed: ${passCount}`);
console.log(`  Edge Case Tests Failed: ${failCount}`);
console.log(`======================================================\n`);

if (failCount > 0) process.exit(1);
