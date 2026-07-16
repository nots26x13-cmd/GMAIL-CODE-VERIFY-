// api/verify-code.js
//
// POST /api/verify-code   { "email": "user@example.com", "code": "123456" }
// GET  /api/verify-code?email=user@example.com&code=123456
//
// Forwards to your Apps Script as ?action=verifyCode&email=...&code=...

import { callGas, setCors } from "./_lib/gasClient.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Use GET or POST" });
  }

  const email = req.method === "GET" ? req.query.email : req.body?.email;
  const code = req.method === "GET" ? req.query.code : req.body?.code;

  if (!email || !code) {
    return res
      .status(400)
      .json({ success: false, error: "email এবং code দুটোই প্রয়োজন" });
  }

  try {
    const { status, data } = await callGas({ action: "verifyCode", email, code });
    return res.status(status).json(data);
  } catch (err) {
    return res
      .status(502)
      .json({ success: false, error: "Apps Script এ পৌঁছানো যায়নি", message: err.message });
  }
}
