<?php
/**
 * OG Tag Injector for InfinityFree static hosting (no Node.js).
 * .htaccess routes social media bot requests for /bai-viet/* to this file.
 * Regular visitors are served index.html directly by .htaccess.
 */

$supabase_url = 'https://gqxrptccptfbzfdmaoyl.supabase.co';
$supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHJwdGNjcHRmYnpmZG1hb3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjIyNzAsImV4cCI6MjA5MDA5ODI3MH0.7lyAtlXFyRBHd3oFAhhxxdqs1rn2GhHdGOuMgEuk-SE';
$site_name = 'Báo Hải Quân Việt Nam - SROV';

// Extract slug from REQUEST_URI: /bai-viet/{slug}
$uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
if (preg_match('#/bai-viet/([^/?#]+)#', $uri, $m)) {
    $slug = $m[1];
} else {
    serve_index();
    exit;
}

// Fetch post from Supabase REST API
$api = $supabase_url . '/rest/v1/posts?slug=eq.' . rawurlencode($slug)
     . '&select=title,excerpt,thumbnail&limit=1';

$ch = curl_init($api);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 5,
    CURLOPT_HTTPHEADER     => [
        'apikey: ' . $supabase_key,
        'Authorization: Bearer ' . $supabase_key,
    ],
]);
$body = curl_exec($ch);
$err  = curl_error($ch);
curl_close($ch);

if ($err || !$body) {
    serve_index();
    exit;
}

$rows = json_decode($body, true);
if (!$rows || count($rows) === 0) {
    serve_index();
    exit;
}

$post  = $rows[0];
$title = trim($post['title'] ?? '');
$desc  = trim($post['excerpt'] ?? '');
$img   = trim($post['thumbnail'] ?? '');

if (!$title) {
    serve_index();
    exit;
}

$proto   = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host    = $_SERVER['HTTP_HOST'] ?? '';
$og_url  = $proto . '://' . $host . '/bai-viet/' . $slug;

$t  = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
$d  = htmlspecialchars($desc,  ENT_QUOTES, 'UTF-8');
$i  = htmlspecialchars($img,   ENT_QUOTES, 'UTF-8');
$u  = htmlspecialchars($og_url, ENT_QUOTES, 'UTF-8');
$sn = htmlspecialchars($site_name, ENT_QUOTES, 'UTF-8');

$og_block = <<<OG
    <meta property="og:type"        content="article" />
    <meta property="og:site_name"   content="{$sn}" />
    <meta property="og:title"       content="{$t}" />
    <meta property="og:description" content="{$d}" />
    <meta property="og:url"         content="{$u}" />
    <meta property="og:image"       content="{$i}" />
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="{$t}" />
    <meta name="twitter:description" content="{$d}" />
    <meta name="twitter:image"       content="{$i}" />
OG;

$html = @file_get_contents(__DIR__ . '/index.html');
if (!$html) {
    serve_index();
    exit;
}

// Replace <title> and inject OG tags before </head>
$html = preg_replace('/<title>[^<]*<\/title>/', '<title>' . $t . ' | ' . $sn . '</title>', $html, 1);
$html = str_replace('</head>', $og_block . "\n  </head>", $html);

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: public, max-age=300');
echo $html;

function serve_index() {
    $html = @file_get_contents(__DIR__ . '/index.html');
    if ($html) {
        header('Content-Type: text/html; charset=UTF-8');
        echo $html;
    } else {
        http_response_code(404);
        echo '404';
    }
}
