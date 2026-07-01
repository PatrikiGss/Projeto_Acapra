<?php
$backend     = 'https://punctual-lavender-buffalo.187-85-164-159.cpanel.site';
$backendHost = 'punctual-lavender-buffalo.187-85-164-159.cpanel.site';
$uri         = $_SERVER['REQUEST_URI'];
$method      = $_SERVER['REQUEST_METHOD'];
$body        = file_get_contents('php://input');

$ch = curl_init($backend . $uri);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_TIMEOUT        => 30,
]);

// Encaminha headers do browser, substituindo Host pelo host real do backend
$skip = ['host', 'connection', 'transfer-encoding', 'content-length'];
$fwd  = ["Host: $backendHost"];
foreach (getallheaders() as $k => $v) {
    if (!in_array(strtolower($k), $skip)) {
        $fwd[] = "$k: $v";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $fwd);

$raw        = curl_exec($ch);
$code       = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err        = curl_error($ch);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

if ($raw === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'proxy_error', 'detail' => $err]);
    exit;
}

$respHeaders = substr($raw, 0, $headerSize);
$respBody    = substr($raw, $headerSize);

http_response_code($code);

// Passa Content-Type, cookies, CORS e headers customizados do Django
foreach (explode("\r\n", $respHeaders) as $line) {
    if (preg_match('/^(Content-Type|Set-Cookie|Authorization|Allow|Access-Control-[\w-]+|X-[\w-]+):/i', $line)) {
        header($line, false);
    }
}

echo $respBody;
