/**
 * Cloudflare Pages Function: /api/truecaller
 * Queries Truecaller upstream REST API at the edge with zero Node.js dependencies.
 */

function normalizeBdPhone(phone) {
  if (!phone) return null;
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('880')) {
    clean = clean.substring(3);
  } else if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  return clean.length >= 8 ? clean : null;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Handle CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const phoneParam = url.searchParams.get('phone') || '';
  const clientToken = url.searchParams.get('installationId') || '';
  const token = clientToken || env.TRUECALLER_INSTALLATION_ID || '';

  const cleanPhone = normalizeBdPhone(phoneParam);
  const webSearchUrl = cleanPhone 
    ? `https://www.truecaller.com/search/bd/${cleanPhone}`
    : 'https://www.truecaller.com';

  if (!phoneParam || !cleanPhone) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'A valid Bangladesh phone number is required (?phone=...)',
        webSearchUrl,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  if (!token) {
    return new Response(
      JSON.stringify({
        success: false,
        fallback: true,
        error: 'Truecaller installation ID not set in environment.',
        phone: phoneParam,
        e164: `+880${cleanPhone}`,
        webSearchUrl,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  try {
    const upstreamUrl = new URL('https://search5-noneu.truecaller.com/v2/search');
    upstreamUrl.searchParams.set('q', cleanPhone);
    upstreamUrl.searchParams.set('countryCode', 'BD');
    upstreamUrl.searchParams.set('type', '4');
    upstreamUrl.searchParams.set('locAddr', '');
    upstreamUrl.searchParams.set('placement', 'SEARCHRESULTS,HISTORY,DETAILS');
    upstreamUrl.searchParams.set('encoding', 'json');

    const res = await fetch(upstreamUrl.toString(), {
      headers: {
        'User-Agent': 'Truecaller/11.75.5 (Android;10)',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          error: `Truecaller upstream returned ${res.status}: ${errText.slice(0, 100)}`,
          phone: phoneParam,
          e164: `+880${cleanPhone}`,
          webSearchUrl,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const data = await res.json();
    const item = data.data?.[0] || data?.[0] || null;

    return new Response(
      JSON.stringify({
        success: true,
        query: phoneParam,
        e164: `+880${cleanPhone}`,
        name: item?.name || null,
        altName: item?.altName || null,
        addresses: item?.addresses || [],
        badges: item?.badges || [],
        webSearchUrl,
        raw: data,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        fallback: true,
        error: err.message || String(err),
        phone: phoneParam,
        e164: `+880${cleanPhone}`,
        webSearchUrl,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
