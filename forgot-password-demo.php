<?php
/**
 * Forgot Password — পূর্ণ ডেমো ফ্লো (email → code → new password)
 *
 * এটা তিনটা ধাপ একই ফাইলে PHP session দিয়ে সামলাচ্ছে:
 *   ১) email দিন → /api/send-code কল হবে
 *   ২) code দিন  → /api/verify-code কল হবে
 *   ৩) নতুন password দিন → (এখানে আপনার নিজের DB আপডেট বসাবেন)
 *
 * ব্যবহারের আগে নিচের $API_BASE বদলে আপনার আসল Vercel URL বসান।
 */

session_start();

$API_BASE = "https://YOUR-PROJECT.vercel.app/api"; // <-- বদলান

function callApi($url, $data)
{
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

$step    = $_SESSION['step'] ?? 'email';
$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if ($step === 'email' && !empty($_POST['email'])) {
        $email  = trim($_POST['email']);
        $result = callApi("$API_BASE/send-code", ['email' => $email]);

        if (!empty($result['success'])) {
            $_SESSION['email'] = $email;
            $_SESSION['step']  = 'code';
            $step    = 'code';
            $message = "কোড পাঠানো হয়েছে। আপনার ইমেইল চেক করুন।";
        } else {
            $message = "কোড পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।";
        }
    } elseif ($step === 'code' && !empty($_POST['code'])) {
        $result = callApi("$API_BASE/verify-code", [
            'email' => $_SESSION['email'],
            'code'  => trim($_POST['code']),
        ]);

        if (!empty($result['success'])) {
            $_SESSION['step'] = 'reset';
            $step    = 'reset';
            $message = "কোড সঠিক! এখন নতুন পাসওয়ার্ড দিন।";
        } else {
            $message = "কোডটি সঠিক নয় অথবা মেয়াদ শেষ হয়ে গেছে।";
        }
    } elseif ($step === 'reset' && !empty($_POST['password'])) {
        // 👉 এখানে আপনার নিজের ডাটাবেজে পাসওয়ার্ড আপডেট করুন, যেমন:
        //
        // $hashed = password_hash($_POST['password'], PASSWORD_DEFAULT);
        // $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
        // $stmt->execute([$hashed, $_SESSION['email']]);

        $message = "পাসওয়ার্ড রিসেট সম্পন্ন হয়েছে (ডেমো — এখানে নিজের DB লজিক বসান)।";
        session_destroy();
        $step = 'done';
    }
}
?>
<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<title>Forgot Password Demo</title>
</head>
<body style="font-family:sans-serif;max-width:400px;margin:60px auto;">
<h2>পাসওয়ার্ড ভুলে গেছেন?</h2>

<?php if ($message): ?>
    <p style="color:#0a7;"><?= htmlspecialchars($message) ?></p>
<?php endif; ?>

<?php if ($step === 'email'): ?>
    <form method="post">
        <input type="email" name="email" placeholder="আপনার ইমেইল" required style="width:100%;padding:8px;">
        <button type="submit" style="margin-top:10px;">কোড পাঠান</button>
    </form>

<?php elseif ($step === 'code'): ?>
    <form method="post">
        <input type="text" name="code" placeholder="৬ ডিজিটের কোড" required style="width:100%;padding:8px;">
        <button type="submit" style="margin-top:10px;">যাচাই করুন</button>
    </form>

<?php elseif ($step === 'reset'): ?>
    <form method="post">
        <input type="password" name="password" placeholder="নতুন পাসওয়ার্ড" required style="width:100%;padding:8px;">
        <button type="submit" style="margin-top:10px;">পাসওয়ার্ড সেট করুন</button>
    </form>

<?php else: ?>
    <p><a href="?">নতুন করে শুরু করুন</a></p>
<?php endif; ?>

</body>
</html>
