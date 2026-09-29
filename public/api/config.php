<?php
/**
 * INDIANLALAJI.COM - Hostinger Server & Database Configuration
 * Handles Hostinger MySQL Database Connection with Automatic FileStorage Fallback
 */

// Enable error reporting for debugging (disable in strict production if desired)
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');

// CORS Headers - Allow cross-origin requests from custom domains and subdomains
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// -----------------------------------------------------------------------------
// 1. Hostinger Database Credentials
// -----------------------------------------------------------------------------
// Enter your Hostinger MySQL database details below (from Hostinger hPanel -> Databases):
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'u873216892_lalaji'); // Hostinger MySQL Username
define('DB_PASS', getenv('DB_PASS') ?: 'IndianLalaji@2026');   // Hostinger MySQL Password
define('DB_NAME', getenv('DB_NAME') ?: 'u873216892_healthcare'); // Hostinger MySQL Database Name

// Directories
define('DATA_DIR', __DIR__ . '/data');
define('UPLOADS_DIR', __DIR__ . '/../uploads');

// Ensure storage directories exist
if (!file_exists(DATA_DIR)) {
    @mkdir(DATA_DIR, 0755, true);
}
if (!file_exists(UPLOADS_DIR)) {
    @mkdir(UPLOADS_DIR, 0755, true);
}

// -----------------------------------------------------------------------------
// 2. Database Connection Helper (PDO with Graceful Fallback)
// -----------------------------------------------------------------------------
$pdo = null;
$storageMode = 'file'; // 'mysql' or 'file'

try {
    if (defined('DB_USER') && DB_USER !== 'u873216892_lalaji' && DB_NAME !== 'u873216892_healthcare') {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 2
        ]);
        $storageMode = 'mysql';
    }
} catch (Exception $e) {
    // If MySQL connection fails, seamlessly fallback to high-performance JSON flat-file storage
    $pdo = null;
    $storageMode = 'file';
}

/**
 * Returns current database PDO or null
 */
function getDbConnection() {
    global $pdo;
    return $pdo;
}

/**
 * Returns current active storage mode
 */
function getStorageMode() {
    global $storageMode;
    return $storageMode;
}

/**
 * JSON File Storage Helper - Reads a collection
 */
function readCollectionFile($collection) {
    $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', $collection);
    $filePath = DATA_DIR . '/' . $safeName . '.json';
    if (!file_exists($filePath)) {
        return [];
    }
    $content = @file_get_contents($filePath);
    if (!$content) return [];
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

/**
 * JSON File Storage Helper - Writes a collection with flock
 */
function writeCollectionFile($collection, $data) {
    $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', $collection);
    $filePath = DATA_DIR . '/' . $safeName . '.json';
    $fp = @fopen($filePath, 'c+');
    if ($fp) {
        if (flock($fp, LOCK_EX)) {
            ftruncate($fp, 0);
            fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            fflush($fp);
            flock($fp, LOCK_UN);
        }
        fclose($fp);
    }
    
    // Update global sync timestamp
    $metaFile = DATA_DIR . '/_meta.json';
    $meta = [
        'lastUpdated' => round(microtime(true) * 1000),
        'lastCollection' => $collection
    ];
    @file_put_contents($metaFile, json_encode($meta));
}

/**
 * Get Global Sync Timestamp
 */
function getSyncMetadata() {
    $metaFile = DATA_DIR . '/_meta.json';
    if (file_exists($metaFile)) {
        $meta = @json_decode(@file_get_contents($metaFile), true);
        if (is_array($meta)) return $meta;
    }
    return [
        'lastUpdated' => round(microtime(true) * 1000),
        'lastCollection' => ''
    ];
}
