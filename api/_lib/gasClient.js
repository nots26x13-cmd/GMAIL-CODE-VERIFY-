// api/_lib/gasClient.js
//
// Shared helper used by send-code.js and verify-code.js.
//
// ASSUMPTION (edit here if your Apps Script differs):
//  - Your Apps Script reads e.parameter.action / e.parameter.email / e.parameter.code
//  - It responds with JSON like { "success": true } or { "success": false, "message": "..." }
//  - GAS_METHOD "GET" works for the common doGet(e) pattern.
//    If your script only has doPost(e), set GAS_METHOD=POST as an env var in Vercel.

export const GAS_URL =
  process.env.GAS_URL ||
  "https://script.google.com/macros/s/AKfycbx2g_SYx03AQQ2RkcfiAxLNd4qePy1DiboQPdcA4wJ1J1MFYUM6QnT3UMpUkjSc27bF3Q/exec";

export const GAS_METHOD = process.env.GAS_METHOD || "GET";

export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// Sends `fields` as URL query params to the Apps Script (works for e.parameter
// whether your script implements doGet or doPost), and tries to parse the
// response as JSON. Falls back to { raw: "..." } if it isn't JSON.
export async function callGas(fields) {
  const url = new URL(GAS_URL);
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  const gasRes = await fetch(url.toString(), {
    method: GAS_METHOD,
    redirect: "follow",
  });

  const text = await gasRes.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: gasRes.status, data };
}
