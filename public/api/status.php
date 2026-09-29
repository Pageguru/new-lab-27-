<?php
/**
 * INDIANLALAJI.COM - Hostinger Server Health & Status Check
 */

require_once __DIR__ . '/config.php';

$meta = getSyncMetadata();
$uploadWritable = is_writable(UPLOADS_DIR);
$dataWritable = is_writable(DATA_DIR);

echo json_encode([
    'status' => 'online',
    'platform' => 'INDIANLALAJI.COM',
    'server' => 'Hostinger',
    'phpVersion' => phpversion(),
    'storageMode' => getStorageMode(),
    'uploadsDirectoryWritable' => $uploadWritable,
    'dataDirectoryWritable' => $dataWritable,
    'lastSyncTimestamp' => $meta['lastUpdated'] ?? 0,
    'timestamp' => round(microtime(true) * 1000)
]);
