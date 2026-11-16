/**
 * Cloudflare Pages Function: /api/auth
 * Fast PIN authentication check for Keystone CRM
 */

const SYSTEM_USERS = {
  '1001': { id: '00000000-0000-0000-0000-000000001001', pin: '1001', name: 'Hasibul Munim (Owner)', role: 'admin', hub: 'ALL', phone: '+8801941646278' },
  '1002': { id: '00000000-0000-0000-0000-000000001002', pin: '1002', name: 'Co-Owner (Admin)', role: 'admin', hub: 'ALL', phone: '+8801941646279' },
  '3001': { id: '00000000-0000-0000-0000-000000003001', pin: '3001', name: 'Caller 1 (Eastern Hub)', role: 'telecaller', hub: 'CALLER_1', phone: '+8801700000002' },
  '3002': { id: '00000000-0000-0000-0000-000000003002', pin: '3002', name: 'Caller 2 (Northern Hub)', role: 'telecaller', hub: 'CALLER_2', phone: '+8801700000003' },
  '3003': { id: '00000000-0000-0000-0000-000000003003', pin: '3003', name: 'Caller 3 (Southern Hub)', role: 'telecaller', hub: 'CALLER_3', phone: '+8801700000004' },
};

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const pin = String(body.pin || '').trim();
      const user = SYSTEM_USERS[pin];

      if (user) {
        return new Response(
          JSON.stringify({ success: true, user }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Invalid 4-digit PIN' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
  }

  return new Response(
    JSON.stringify({
      users: Object.values(SYSTEM_USERS).map(u => ({ pin: u.pin, name: u.name, role: u.role, hub: u.hub }))
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    }
  );
}
