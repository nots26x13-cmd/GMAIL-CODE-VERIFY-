// api/proxy.js
//
// Generic transparent proxy: forwards whatever request it receives
// (GET query params, POST body, any content-type) straight to your
// Google Apps Script Web App, and returns the response as-is.
//
// This means whatever your Apps Script already does (e.g. sending /
// verifying a code) keeps working exactly the same — you just call
// THIS Vercel URL instead of the script.google.com URL directly.
//
// Set GAS_URL as an environment variable in Vercel for flexibility,
// otherwise it falls back to the URL hardcoded below.

export const config = {
  api: {
    bodyParser: false, // we forward the raw body untouched
  },
};

const GAS_URL =
  process.env.GAS_URL ||
  "https://script.google.com/macros/s/AKfycbx2g_SYx03AQQ2RkcfiAxLNd4qePy1DiboQPdcA4wJ1J1MFYUM6QnT3UMpUkjSc27bF3Q/exec";

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function buildQueryString(query) {
  const params = new URLSearchParams();
  for (const key in query) {
    const value = query[key];
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value !== undefined) {
      params.append(key, value);
    }
  }
  return params.toString();
}

export default async function handler(req, res) {
  // Allow calling this from PHP, browser JS, anywhere — no CORS headaches.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const url = new URL(GAS_URL);
    const qs = buildQueryString(req.query || {});
    if (qs) url.search = qs;

    const fetchOptions = {
      method: req.method,
      redirect: "follow", // Apps Script exec URLs 302-redirect to googleusercontent.com
    };

    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const rawBody = await getRawBody(req);
      if (rawBody.length > 0) {
        fetchOptions.body = rawBody;
        fetchOptions.headers = {
          "Content-Type": req.headers["content-type"] || "application/json",
        };
      }
    }

    const gasResponse = await fetch(url.toString(), fetchOptions);
    const contentType = gasResponse.headers.get("content-type") || "text/plain";
    const text = await gasResponse.text();

    res.status(gasResponse.status);
    res.setHeader("Content-Type", contentType);
    res.send(text);
  } catch (err) {
    res.status(502).json({
      error: "Google Apps Script proxy failed",
      message: err.message,
    });
  }
}
