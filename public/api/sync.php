<?php
/**
 * INDIANLALAJI.COM - Real-Time Multi-Device Sync Engine for Hostinger
 * Saves and synchronizes images, text, add, edit, delete, update, settings, products & reports
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// -----------------------------------------------------------------------------
// GET Requests: Check Updates, Get Collection, Get All
// -----------------------------------------------------------------------------
if ($method === 'GET') {
    if ($action === 'check_updates') {
        $since = isset($_GET['since']) ? (float)$_GET['since'] : 0;
        $meta = getSyncMetadata();
        $serverTime = round(microtime(true) * 1000);
        $lastUpdated = (float)($meta['lastUpdated'] ?? 0);
        
        $hasUpdates = $lastUpdated > $since;
        $updatedCollections = [];
        
        if (isset($meta['collections']) && is_array($meta['collections'])) {
            foreach ($meta['collections'] as $col => $ts) {
                if ((float)$ts > $since) {
                    $updatedCollections[] = $col;
                }
            }
        }
        
        // Fallback for legacy meta
        if ($hasUpdates && empty($updatedCollections)) {
            $updatedCollections = [
                'reception_entries',
                'lab_reports',
                'vendor_bookings',
                'lab_staff',
                'lab_settings',
                'lab_tests',
                'lab_packages',
                'lab_doctors',
                'vendor_branches',
                'company_settings',
                'portal_sections',
                'vendor_labs',
                'pricing_plans',
                'contact_submissions',
                'domain_requests'
            ];
        }

        echo json_encode([
            'status' => 'success',
            'serverTime' => $serverTime,
            'lastUpdated' => $lastUpdated,
            'hasUpdates' => $hasUpdates,
            'updatedCollections' => $updatedCollections,
            'storageMode' => getStorageMode()
        ]);
        exit();
    }

    if ($action === 'get_collection') {
        $collection = $_GET['collection'] ?? '';
        if (!$collection) {
            echo json_encode(['status' => 'error', 'message' => 'Missing collection name']);
            exit();
        }
        $data = readCollectionFile($collection);
        $resp = [
            'status' => 'success',
            'collection' => $collection,
            'data' => $data,
            'serverTime' => round(microtime(true) * 1000)
        ];
        if ($collection === 'lab_settings' && is_array($data)) {
            $map = [];
            foreach ($data as $item) {
                $lid = $item['labId'] ?? $item['id'] ?? '';
                if ($lid) $map[$lid] = $item;
            }
            $resp['map'] = $map;
        }
        echo json_encode($resp);
        exit();
    }

    // Default GET: Fetch all active collections
    $knownCollections = [
        'reception_entries',
        'lab_reports',
        'vendor_bookings',
        'lab_staff',
        'lab_settings',
        'lab_tests',
        'lab_packages',
        'lab_doctors',
        'vendor_branches',
        'company_settings',
        'portal_sections',
        'vendor_labs',
        'pricing_plans',
        'contact_submissions',
        'domain_requests'
    ];

    $allData = [];
    foreach ($knownCollections as $col) {
        $allData[$col] = readCollectionFile($col);
    }

    $meta = getSyncMetadata();
    echo json_encode([
        'status' => 'success',
        'data' => $allData,
        'serverTime' => round(microtime(true) * 1000),
        'lastUpdated' => $meta['lastUpdated'] ?? round(microtime(true) * 1000),
        'storageMode' => getStorageMode()
    ]);
    exit();
}

// -----------------------------------------------------------------------------
// POST Requests: Save, Delete, Batch Save
// -----------------------------------------------------------------------------
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $payload = json_decode($input, true);

    if (!is_array($payload)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload']);
        exit();
    }

    $postAction = $payload['action'] ?? 'save';
    $collection = $payload['collection'] ?? '';

    if ($postAction === 'save') {
        if (!$collection || !isset($payload['id'])) {
            echo json_encode(['status' => 'error', 'message' => 'Missing collection or document ID']);
            exit();
        }

        $id = (string)$payload['id'];
        $itemData = $payload['data'] ?? [];
        $itemData['id'] = $itemData['id'] ?? $id;
        $itemData['_updatedAt'] = date('c');

        $currentList = readCollectionFile($collection);
        $found = false;

        for ($i = 0; $i < count($currentList); $i++) {
            $existingId = $currentList[$i]['id'] ?? $currentList[$i]['reportId'] ?? $currentList[$i]['labId'] ?? '';
            if ($existingId == $id) {
                // Merge updates
                $currentList[$i] = array_merge($currentList[$i], $itemData);
                $found = true;
                break;
            }
        }

        if (!$found) {
            array_unshift($currentList, $itemData);
        }

        writeCollectionFile($collection, $currentList);

        echo json_encode([
            'status' => 'success',
            'action' => 'save',
            'collection' => $collection,
            'id' => $id,
            'serverTime' => round(microtime(true) * 1000)
        ]);
        exit();
    }

    if ($postAction === 'delete') {
        if (!$collection || !isset($payload['id'])) {
            echo json_encode(['status' => 'error', 'message' => 'Missing collection or ID']);
            exit();
        }

        $id = (string)$payload['id'];
        $currentList = readCollectionFile($collection);
        $newList = [];

        foreach ($currentList as $item) {
            $itemId = $item['id'] ?? $item['reportId'] ?? $item['labId'] ?? '';
            if ($itemId != $id) {
                $newList[] = $item;
            }
        }

        writeCollectionFile($collection, $newList);

        echo json_encode([
            'status' => 'success',
            'action' => 'delete',
            'collection' => $collection,
            'id' => $id,
            'serverTime' => round(microtime(true) * 1000)
        ]);
        exit();
    }

    if ($postAction === 'batch_save') {
        $items = $payload['items'] ?? [];
        if (!$collection || !is_array($items)) {
            echo json_encode(['status' => 'error', 'message' => 'Missing collection or items']);
            exit();
        }

        $currentList = readCollectionFile($collection);
        $map = [];
        foreach ($currentList as $it) {
            $itId = $it['id'] ?? $it['reportId'] ?? $it['labId'] ?? '';
            if ($itId) $map[$itId] = $it;
        }

        foreach ($items as $newItem) {
            $newId = $newItem['id'] ?? $newItem['reportId'] ?? $newItem['labId'] ?? '';
            if ($newId) {
                $newItem['_updatedAt'] = date('c');
                $map[$newId] = isset($map[$newId]) ? array_merge($map[$newId], $newItem) : $newItem;
            }
        }

        writeCollectionFile($collection, array_values($map));

        echo json_encode([
            'status' => 'success',
            'action' => 'batch_save',
            'collection' => $collection,
            'count' => count($items),
            'serverTime' => round(microtime(true) * 1000)
        ]);
        exit();
    }

    if ($postAction === 'seed_all') {
        $allCollections = $payload['collections'] ?? [];
        if (is_array($allCollections)) {
            foreach ($allCollections as $colName => $colItems) {
                if (is_array($colItems)) {
                    $existing = readCollectionFile($colName);
                    if (empty($existing)) {
                        writeCollectionFile($colName, $colItems);
                    }
                }
            }
        }
        echo json_encode([
            'status' => 'success',
            'action' => 'seed_all',
            'serverTime' => round(microtime(true) * 1000)
        ]);
        exit();
    }

    echo json_encode(['status' => 'error', 'message' => 'Unknown action: ' . $postAction]);
    exit();
}
