// Bulk upload all 859 Bangladesh centers to Supabase
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://myuvhvmdftaxvdhrwwmu.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_JxGaanhRLZCmGhUskHs4LQ_SI1y7aNy';

async function bulkUpload() {
  const jsonPath = path.join(__dirname, '../all_bangladesh_centers.json');
  console.log(`Reading centers from: ${jsonPath}`);
  
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const centers = JSON.parse(rawData);
  console.log(`Loaded ${centers.length} centers.`);

  const cleanRecords = centers.map(c => ({
    id: c.id,
    name: c.name || 'Unknown Center',
    district: c.district || 'Dhaka',
    phone: c.phone || '',
    url: c.url || c.link || '',
    link: c.link || c.url || '',
    status: c.status || 'New',
    priority: c.priority || 'Medium',
    lastContact: c.lastContact || '',
    followUpDate: c.followUpDate || '',
    studentCount: typeof c.studentCount === 'number' ? c.studentCount : 0,
    referredStudents: typeof c.referredStudents === 'number' ? c.referredStudents : 0,
    employee: c.employee || '',
    notes: Array.isArray(c.notes) ? c.notes : []
  }));

  const BATCH_SIZE = 50;
  let uploaded = 0;

  for (let i = 0; i < cleanRecords.length; i += BATCH_SIZE) {
    const batch = cleanRecords.slice(i, i + BATCH_SIZE);
    const endpoint = `${SUPABASE_URL}/rest/v1/b2b_centers`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(batch)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Batch ${i / BATCH_SIZE + 1} failed (HTTP ${res.status}): ${errText}`);
      process.exit(1);
    }

    uploaded += batch.length;
    console.log(`Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(cleanRecords.length / BATCH_SIZE)}: ${uploaded}/${cleanRecords.length} centers synced.`);
  }

  console.log(`\nSUCCESS: All ${uploaded} centers uploaded & synced to Supabase b2b_centers table!`);
}

bulkUpload().catch(err => {
  console.error('Fatal error during bulk upload:', err);
  process.exit(1);
});
