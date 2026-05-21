<?php
/**
 * OG Tag Injector for InfinityFree static hosting (no Node.js).
 * .htaccess routes social media / search bot requests for /bai-viet/* here.
 * Regular visitors are served index.html directly by .htaccess.
 */

$supabase_url = 'https://gqxrptccptfbzfdmaoyl.supabase.co';
$supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHJwdGNjcHRmYnpmZG1hb3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjIyNzAsImV4cCI6MjA5MDA5ODI3MH0.7lyAtlXFyRBHd3oFAhhxxdqs1rn2GhHdGOuMgEuk-SE';
$site_name     = 'Báo Hải Quân Việt Nam - SROV';
$og_site_name  = 'Cổng Thông Tin SROV';
$default_desc  = 'Cơ quan ngôn luận của Quân chủng Hải quân Nhân dân Việt Nam';
$default_img   = 'https://baohaiquansrov.xo.je/opengraph.jpg';

// ── Helpers ────────────────────────────────────────────────────────────────

function strip_tags_custom($str) {
    return trim(preg_replace('/\s+/', ' ', strip_tags((string)$str)));
}

function truncate_str($str, $max = 180) {
    $clean = strip_tags_custom($str);
    return mb_strlen($clean) > $max ? mb_substr($clean, 0, $max - 1) . '…' : $clean;
}

function normalize_url($value, $fallback) {
    if (!$value) return $fallback;
    $v = trim((string)$value);
    if (preg_match('#^https?://#i', $v)) return $v;
    return $fallback;
}

/**
 * Parse the og_image field which may be:
 *   - A plain URL string
 *   - [OG:{"image":"...","title":"..."}]
 *   - [GALLERY:["url1","url2",...]]
 * Returns ['image' => url, 'title' => string|null]
 */
function parse_og_field($value) {
    if (!$value) return ['image' => null, 'title' => null];
    $v = trim((string)$value);

    if (strpos($v, '[OG:') === 0) {
        $json = substr($v, 4, -1);
        $data = json_decode($json, true);
        if ($data) {
            $img = $data['image'] ?? ($data['gallery'][0] ?? null);
            return ['image' => $img ?: null, 'title' => $data['title'] ?? null];
        }
    }

    if (strpos($v, '[GALLERY:') === 0) {
        $json = substr($v, 9, -1);
        $arr  = json_decode($json, true);
        if (is_array($arr) && count($arr) > 0) {
            return ['image' => $arr[0], 'title' => null];
        }
    }

    return ['image' => $v, 'title' => null];
}

// ── Extract slug from REQUEST_URI ──────────────────────────────────────────

$uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
if (preg_match('#/bai-viet/([^/?#]+)#', $uri, $m)) {
    $slug = rawurldecode($m[1]);
} else {
    serve_index();
    exit;
}

// ── Fetch post from Supabase REST API ──────────────────────────────────────

$fields = 'title,content,excerpt,thumbnail,og_image,meta_title,meta_description,author,published_at,updated_at,slug';
$api    = $supabase_url . '/rest/v1/posts'
        . '?slug=eq.'   . rawurlencode($slug)
        . '&status=eq.published'
        . '&select='    . $fields
        . '&limit=1';

$ch = curl_init($api);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 6,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_HTTPHEADER     => [
        'apikey: '        . $supabase_key,
        'Authorization: Bearer ' . $supabase_key,
        'Accept: application/json',
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
if (!is_array($rows) || count($rows) === 0) {
    serve_index();
    exit;
}

$post = $rows[0];

// ── Resolve title ──────────────────────────────────────────────────────────

$og_parsed  = parse_og_field($post['og_image'] ?? '');
$title_raw  = $og_parsed['title']
           ?: strip_tags_custom($post['meta_title']  ?? '')
           ?: strip_tags_custom($post['title']        ?? '');

if (!$title_raw) {
    serve_index();
    exit;
}

// ── Resolve description ────────────────────────────────────────────────────

$desc_raw = truncate_str(
    $post['meta_description'] ?? $post['excerpt'] ?? $post['content'] ?? $default_desc
);
if (!$desc_raw) $desc_raw = $default_desc;

// ── Resolve image ──────────────────────────────────────────────────────────

$img_raw = normalize_url(
    $og_parsed['image'] ?: ($post['thumbnail'] ?? ''),
    $default_img
);

// ── Build canonical URL ────────────────────────────────────────────────────

$proto  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host   = $_SERVER['HTTP_HOST'] ?? 'baohaiquansrov.xo.je';
$og_url = $proto . '://' . $host . '/bai-viet/' . rawurlencode($slug);

// ── Escape for HTML ────────────────────────────────────────────────────────

$t   = htmlspecialchars($title_raw,  ENT_QUOTES, 'UTF-8');
$pt  = htmlspecialchars($title_raw . ' | ' . $site_name, ENT_QUOTES, 'UTF-8');
$d   = htmlspecialchars($desc_raw,   ENT_QUOTES, 'UTF-8');
$i   = htmlspecialchars($img_raw,    ENT_QUOTES, 'UTF-8');
$u   = htmlspecialchars($og_url,     ENT_QUOTES, 'UTF-8');
$sn  = htmlspecialchars($site_name,  ENT_QUOTES, 'UTF-8');
$osn = htmlspecialchars($og_site_name, ENT_QUOTES, 'UTF-8');
$au  = htmlspecialchars(strip_tags_custom($post['author'] ?? $site_name), ENT_QUOTES, 'UTF-8');
$pub = htmlspecialchars($post['published_at'] ?? '', ENT_QUOTES, 'UTF-8');
$mod = htmlspecialchars($post['updated_at']   ?? $post['published_at'] ?? '', ENT_QUOTES, 'UTF-8');

// ── Build OG block ─────────────────────────────────────────────────────────

$og_block  = "    <title>{$pt}</title>\n";
$og_block .= "    <meta name=\"description\" content=\"{$d}\" />\n";
$og_block .= "    <meta name=\"author\" content=\"{$au}\" />\n";
$og_block .= "    <meta property=\"og:site_name\" content=\"{$osn}\" />\n";
$og_block .= "    <meta property=\"og:type\" content=\"article\" />\n";
$og_block .= "    <meta property=\"og:title\" content=\"{$t}\" />\n";
$og_block .= "    <meta property=\"og:description\" content=\"{$d}\" />\n";
$og_block .= "    <meta property=\"og:url\" content=\"{$u}\" />\n";
$og_block .= "    <meta property=\"og:image\" content=\"{$i}\" />\n";
$og_block .= "    <meta property=\"og:image:secure_url\" content=\"{$i}\" />\n";
$og_block .= "    <meta property=\"og:image:width\" content=\"1200\" />\n";
$og_block .= "    <meta property=\"og:image:height\" content=\"630\" />\n";
$og_block .= "    <meta property=\"og:image:alt\" content=\"{$t}\" />\n";
$og_block .= "    <meta property=\"og:locale\" content=\"vi_VN\" />\n";
$og_block .= "    <meta property=\"article:author\" content=\"{$au}\" />\n";
if ($pub) $og_block .= "    <meta property=\"article:published_time\" content=\"{$pub}\" />\n";
if ($mod) $og_block .= "    <meta property=\"article:modified_time\" content=\"{$mod}\" />\n";
$og_block .= "    <meta name=\"twitter:card\" content=\"summary_large_image\" />\n";
$og_block .= "    <meta name=\"twitter:site\" content=\"@SROVNavy36\" />\n";
$og_block .= "    <meta name=\"twitter:title\" content=\"{$t}\" />\n";
$og_block .= "    <meta name=\"twitter:description\" content=\"{$d}\" />\n";
$og_block .= "    <meta name=\"twitter:image\" content=\"{$i}\" />\n";
$og_block .= "    <link rel=\"canonical\" href=\"{$u}\" />\n";

// ── Load index.html, strip old meta tags, inject OG block ─────────────────

$html = @file_get_contents(__DIR__ . '/index.html');
if (!$html) {
    serve_index();
    exit;
}

// Remove existing title and any conflicting meta/link tags
$html = preg_replace('/<title>[^<]*<\/title>\s*/i', '', $html);
$html = preg_replace(
    '/<meta\s+(?:name|property)=["\'](?:description|author|og:[^"\']+|article:[^"\']+|twitter:[^"\']+)["\'][^>]*>\s*/i',
    '',
    $html
);
$html = preg_replace('/<link\s+rel=["\']canonical["\'][^>]*>\s*/i', '', $html);

// Inject OG block just before </head>
$html = str_replace('</head>', $og_block . "  </head>", $html);

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: public, max-age=300');
echo $html;

// ── Fallback: serve plain index.html ──────────────────────────────────────

function serve_index() {
    $html = @file_get_contents(__DIR__ . '/index.html');
    if ($html) {
        header('Content-Type: text/html; charset=UTF-8');
        echo $html;
    } else {
        http_response_code(404);
        echo '404 Not Found';
    }
}
