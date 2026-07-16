# GAS → Vercel Login/Forgot-Password API

আপনার Google Apps Script Web App এর সামনে একটা Vercel API — যাতে PHP থেকে সহজে **কোড পাঠানো (send code)** আর **কোড যাচাই (verify code)** করা যায়। এটা একটা সাধারণ password-forget/OTP সিস্টেমে যা যা লাগে তার মূল অংশ।

Apps Script URL হিসেবে এখানে যেটা ব্যবহার করা হয়েছে:
```
https://script.google.com/macros/s/AKfycbx2g_SYx03AQQ2RkcfiAxLNd4qePy1DiboQPdcA4wJ1J1MFYUM6QnT3UMpUkjSc27bF3Q/exec
```

## ⚠️ গুরুত্বপূর্ণ assumption

আমি আপনার Apps Script এর ভেতরের কোড দেখতে পারিনি (Google robots.txt / URL দৈর্ঘ্যের কারণে fetch ব্লক হয়েছে)। তাই ধরে নেওয়া হয়েছে আপনার script:

- `e.parameter.action` (মান: `"sendCode"` বা `"verifyCode"`), `e.parameter.email`, `e.parameter.code` — এই নামে parameter গুলো পড়ে
- JSON রেসপন্স দেয়, যেমন `{ "success": true }` অথবা `{ "success": false, "message": "..." }`
- `doGet(e)` ফাংশন আছে (GET request দিয়ে কল হয়)

**যদি আপনার script অন্যভাবে কাজ করে**, নিচের জায়গাগুলো বদলাতে হবে:

| তোমার script যা করে | কী বদলাবে |
|---|---|
| শুধু `doPost(e)` আছে, `doGet` নেই | Vercel-এ env variable `GAS_METHOD=POST` সেট করুন |
| parameter এর নাম আলাদা (যেমন `mail` না `email`) | `api/send-code.js` ও `api/verify-code.js` তে `action`/`email`/`code` কী-গুলো বদলান |
| রেসপন্স ফরম্যাট আলাদা (যেমন `{"status":"ok"}`) | PHP ডেমো ফাইলে `$result['success']` চেক করার জায়গাটা বদলান |

এই default না মিললে, আপনার script এর `doGet`/`doPost` কোডটা পাঠালে আমি হুবহু মিলিয়ে ঠিক করে দিতে পারব।

## ফোল্ডার স্ট্রাকচার

```
gas-vercel-proxy/
├── api/
│   ├── _lib/
│   │   └── gasClient.js        ← Apps Script কল করার শেয়ারড লজিক
│   ├── send-code.js             ← POST /api/send-code
│   ├── verify-code.js           ← POST /api/verify-code
│   └── proxy.js                 ← জেনেরিক পাস-থ্রু (অন্য যেকোনো action এর জন্য)
├── forgot-password-demo.php     ← পুরো ফ্লো এর চলমান ডেমো
├── example.php                  ← কার্ল দিয়ে সহজ উদাহরণ
├── package.json
├── .env.example
└── README.md
```

## ১. Deploy করুন

```bash
npm i -g vercel
cd gas-vercel-proxy
vercel
```
Deploy শেষে একটা URL পাবেন, যেমন `https://gas-vercel-proxy.vercel.app`।

## ২. এন্ডপয়েন্টগুলো

### কোড পাঠান
```
POST https://YOUR-PROJECT.vercel.app/api/send-code
Body: { "email": "user@example.com" }
```
এটা ভেতরে Apps Script কে `?action=sendCode&email=user@example.com` দিয়ে কল করে।

### কোড যাচাই
```
POST https://YOUR-PROJECT.vercel.app/api/verify-code
Body: { "email": "user@example.com", "code": "123456" }
```
এটা ভেতরে Apps Script কে `?action=verifyCode&email=...&code=...` দিয়ে কল করে।

### GET দিয়েও কল করা যায় (টেস্ট করার জন্য সুবিধাজনক)
```
https://YOUR-PROJECT.vercel.app/api/send-code?email=user@example.com
https://YOUR-PROJECT.vercel.app/api/verify-code?email=user@example.com&code=123456
```

## ৩. PHP থেকে ব্যবহার

- `example.php` — শুধু দুইটা API কল করার সহজ curl উদাহরণ
- `forgot-password-demo.php` — **সম্পূর্ণ চলমান ডেমো**: email ফর্ম → code ফর্ম → নতুন password ফর্ম, PHP session দিয়ে ধাপ মনে রাখে। এই ফাইলের ভেতরে `$API_BASE` বদলে আপনার আসল Vercel URL বসিয়ে সরাসরি চালাতে পারবেন।

পাসওয়ার্ড রিসেটের শেষ ধাপ — অর্থাৎ কোড ভেরিফাই হওয়ার পর নতুন পাসওয়ার্ড আপনার নিজের ডাটাবেজে (MySQL ইত্যাদি) সেভ করা — সেটা আপনার নিজের অ্যাপ্লিকেশনের অংশ, তাই `forgot-password-demo.php` তে ওই জায়গায় একটা comment রাখা আছে যেখানে আপনার `UPDATE users SET password = ...` বসাবেন।

## নিরাপত্তা সংক্রান্ত পরামর্শ (সাধারণ ভালো চর্চা)

- কোড কয়েক মিনিট পর expire করে দিন (এটা আপনার Apps Script এর দায়িত্ব)
- একই ইমেইলে বারবার কোড পাঠানো rate-limit করুন, যাতে কেউ spam না করতে পারে
- verify-code এর রেসপন্সে আসল কোড কখনো ফেরত পাঠাবেন না
- ইমেইল আসলে সিস্টেমে আছে কিনা তা প্রকাশ না করে সবসময় একই রকম মেসেজ দিন (যেমন "কোড পাঠানো হয়েছে যদি ইমেইলটি নিবন্ধিত থাকে")

## যদি default assumption না মেলে

আপনার Apps Script এর `doGet`/`doPost` ফাংশনের কোডটা শেয়ার করলে আমি `api/_lib/gasClient.js`, `api/send-code.js`, ও `api/verify-code.js` — এই তিনটা ফাইল আপনার script এর সাথে হুবহু মিলিয়ে ঠিক করে দেব।
