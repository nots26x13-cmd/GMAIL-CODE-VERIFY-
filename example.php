<?php
/**
 * Quick reference: how to call your two Vercel endpoints from PHP.
 * See forgot-password-demo.php for a full, runnable flow.
 */

$API_BASE = "https://YOUR-PROJECT.vercel.app/api"; // <-- আপনার আসল Vercel domain বসান

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

// --- ধাপ ১: কোড পাঠান ---
$result = callApi("$API_BASE/send-code", [
    "email" => "user@example.com",
]);
// প্রত্যাশিত রেসপন্স (assumption): { "success": true }
var_dump($result);

// --- ধাপ ২: কোড যাচাই করুন ---
$result = callApi("$API_BASE/verify-code", [
    "email" => "user@example.com",
    "code"  => "123456",
]);
// প্রত্যাশিত রেসপন্স (assumption): { "success": true } অথবা { "success": false }
var_dump($result);
