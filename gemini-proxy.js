// A simple Netlify Function that proxies requests to Google's Generative Language API.
// Put this file in your repo at netlify/functions/gemini-proxy.js
// Set GEMINI_API_KEY in Netlify environment variables (do NOT commit the key).

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*", // during testing allow all; replace with your origin in production
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server missing API key (set GEMINI_API_KEY in Netlify env vars)." })
      };
    }

    const model = (event.queryStringParameters && event.queryStringParameters.model)
      || "gemini-2.5-flash-preview-09-2025";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

    // Forward client's body unchanged
    const fetchRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.body || "{}"
    });

    const respText = await fetchRes.text();

    // Forward response status and content-type header to client
    return {
      statusCode: fetchRes.status,
      headers: { ...headers, "Content-Type": fetchRes.headers.get('content-type') || 'application/json' },
      body: respText
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
