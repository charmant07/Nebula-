// A simple Netlify Function that proxies requests to Google's Generative Language API.
// It expects POST bodies from the client and a query parameter `model` (e.g. ?model=gemini-2.5-flash-preview-09-2025).
// Put your real API key into Netlify env var GEMINI_API_KEY (do NOT commit the key to the repo).

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*", // during testing allow all; tighten to your domain in production
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

    // Choose model from query param; default to a text model if not supplied
    const model = (event.queryStringParameters && event.queryStringParameters.model)
      || "gemini-2.5-flash-preview-09-2025";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

    // Forward client's body directly
    const fetchRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.body || "{}"
    });

    const text = await fetchRes.text(); // forward raw text (JSON) back to client
    // return the status and body received from Google
    return {
      statusCode: fetchRes.status,
      headers: { ...headers, "Content-Type": fetchRes.headers.get('content-type') || 'application/json' },
      body: text
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
