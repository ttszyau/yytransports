// api/proxy.js
export default async function handler(req, res) {
  // Only allow GET (you can add POST later if needed)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  try {
    const targetUrl = decodeURIComponent(url);

    // Optional: only allow specific domains (security)
    if (!targetUrl.startsWith('https://data.etabus.gov.hk/') &&
        !targetUrl.startsWith('https://rt.data.gov.hk/')) {
      return res.status(403).json({ error: 'Invalid or disallowed target URL' });
    }

    const headers = {
      'User-Agent': 'YY-Transports-CORS-Proxy/1.0 (like a browser)',
      'Accept': 'application/json',
      // Forward useful headers from client if needed
      ...req.headers['x-forwarded-for'] && { 'X-Forwarded-For': req.headers['x-forwarded-for'] }
    };

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream error', status: response.status });
    }

    const data = await response.json();

    // Add CORS headers so your GitHub Pages site can read it
    res.setHeader('Access-Control-Allow-Origin', '*');           // or 'https://ttszyau.github.io'
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle preflight (OPTIONS) requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: 'Proxy failed', details: err.message });
  }
}

// Optional: run at edge for lower latency (good for transport apps)
export const config = {
  runtime: 'edge',          // or leave out = default serverless
};
