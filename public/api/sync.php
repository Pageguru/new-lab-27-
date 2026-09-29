<?php
/**
 * INDIANLALAJI.COM - Real-Time Multi-Device Sync Engine for Hostinger
 * Primary Source of Truth: Hostinger MySQL Database (with JSON File Storage Resilience)
 * Saves and synchronizes images, text, add, edit, delete, update, settings, products & reports
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Mapping from CMS collection name to MySQL table name and primary ID column
$TABLE_MAP = [
    'reception_entries'   => ['table' => 'lab_reception_entries', 'id' => 'id'],
    'lab_reports'         => ['table' => 'lab_reports',           'id' => 'reportId'],
    'vendor_bookings'     => ['table' => 'lab_bookings',          'id' => 'id'],
    'lab_staff'           => ['table' => 'lab_staff',             'id' => 'id'],
    'lab_settings'        => ['table' => 'lab_settings',          'id' => 'labId'],
    'lab_tests'           => ['table' => 'lab_tests',             'id' => 'id'],
    'lab_packages'        => ['table' => 'lab_packages',          'id' => 'id'],
    'lab_doctors'         => ['table' => 'lab_doctors',           'id' => 'id'],
    'vendor_branches'     => ['table' => 'lab_branches',          'id' => 'id'],
    'vendor_labs'         => ['table' => 'vendor_labs',           'id' => 'id'],
    'company_settings'    => ['table' => 'company_settings',      'id' => 'id'],
    'portal_sections'     => ['table' => 'portal_sections',       'id' => 'id'],
    'pricing_plans'       => ['table' => 'pricing_plans',         'id' => 'id'],
    'contact_submissions' => ['table' => 'contact_submissions',   'id' => 'id'],
    'domain_requests'     => ['table' => 'domain_requests',       'id' => 'id'],
    'lab_images'          => ['table' => 'lab_images',            'id' => 'id']
];

/**
 * Read collection from MySQL if available, with graceful fallback to JSON file
 */
function fetchCollectionData($collection) {
    global $pdo, $TABLE_MAP;
    
    if ($pdo && isset($TABLE_MAP[$collection])) {
        $meta = $TABLE_MAP[$collection];
        $tableName = $meta['table'];
        $idCol = $meta['id'];
        
        try {
            $stmt = $pdo->query("SELECT * FROM `{$tableName}`");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (is_array($rows) && count($rows) > 0) {
                $processed = [];
                foreach ($rows as $row) {
                    // Normalize JSON fields
                    if (isset($row['settingsJson']) && $row['settingsJson']) {
                        $extra = json_decode($row['settingsJson'], true);
                        if (is_array($extra)) {
                            $row = array_merge($extra, $row);
                        }
                    }
                    if (isset($row['data']) && $row['data']) {
                        $extra = json_decode($row['data'], true);
                        if (is_array($extra)) {
                            $row = array_merge($extra, $row);
                        }
                    }
                    if (isset($row['sectionsJson']) && $row['sectionsJson']) {
                        $extra = json_decode($row['sectionsJson'], true);
                        if (is_array($extra)) {
                            $row = array_merge($extra, $row);
                        }
                    }
                    if (isset($row['selectedTests']) && is_string($row['selectedTests'])) {
                        $row['selectedTests'] = json_decode($row['selectedTests'], true) ?: $row['selectedTests'];
                    }
                    if (isset($row['parameters']) && is_string($row['parameters'])) {
                        $row['parameters'] = json_decode($row['parameters'], true) ?: $row['parameters'];
                    }
                    if (isset($row['features']) && is_string($row['features'])) {
                        $row['features'] = json_decode($row['features'], true) ?: $row['features'];
                    }
                    if (isset($row['testsIncluded']) && is_string($row['testsIncluded'])) {
                        $row['testsIncluded'] = json_decode($row['testsIncluded'], true) ?: $row['testsIncluded'];
                    }
                    $processed[] = $row;
                }
                return $processed;
            }
        } catch (Exception $e) {
            // Table may not exist yet or connection error; fall through to JSON file
        }
    }
    
    return readCollectionFile($collection);
}

/**
 * Persist document into Hostinger MySQL
 */
function persistDocToMySql($collection, $id, $data) {
    global $pdo, $TABLE_MAP;
    if (!$pdo || !isset($TABLE_MAP[$collection])) return false;

    $meta = $TABLE_MAP[$collection];
    $tableName = $meta['table'];
    $idCol = $meta['id'];

    try {
        if ($collection === 'vendor_labs') {
            $stmt = $pdo->prepare("REPLACE INTO `vendor_labs` (
                `id`, `slug`, `name`, `tagline`, `logoUrl`, `address`, `city`, `state`, `pincode`,
                `phone`, `email`, `rating`, `totalReviews`, `badge`, `accreditation`, `status`,
                `isWebsiteApproved`, `isEmergency`, `approvedAt`, `approvedBy`, `ownerName`
            ) VALUES (
                :id, :slug, :name, :tagline, :logoUrl, :address, :city, :state, :pincode,
                :phone, :email, :rating, :totalReviews, :badge, :accreditation, :status,
                :isWebsiteApproved, :isEmergency, :approvedAt, :approvedBy, :ownerName
            )");
            $stmt->execute([
                ':id' => $id,
                ':slug' => $data['slug'] ?? ($data['domainPreview'] ?? $id),
                ':name' => $data['name'] ?? 'Diagnostic Lab',
                ':tagline' => $data['tagline'] ?? null,
                ':logoUrl' => $data['logoUrl'] ?? null,
                ':address' => $data['address'] ?? null,
                ':city' => $data['city'] ?? null,
                ':state' => $data['state'] ?? null,
                ':pincode' => $data['pincode'] ?? null,
                ':phone' => $data['phone'] ?? null,
                ':email' => $data['email'] ?? null,
                ':rating' => $data['rating'] ?? 4.9,
                ':totalReviews' => $data['totalReviews'] ?? 100,
                ':badge' => $data['badge'] ?? 'Verified Lab',
                ':accreditation' => $data['accreditation'] ?? 'NABL ISO 15189',
                ':status' => $data['status'] ?? 'Active',
                ':isWebsiteApproved' => !empty($data['isWebsiteApproved']) ? 1 : 0,
                ':isEmergency' => isset($data['emergency']) ? ($data['emergency'] ? 1 : 0) : 1,
                ':approvedAt' => $data['approvedAt'] ?? null,
                ':approvedBy' => $data['approvedBy'] ?? null,
                ':ownerName' => $data['ownerName'] ?? null
            ]);
            return true;
        }

        if ($collection === 'lab_settings') {
            $stmt = $pdo->prepare("REPLACE INTO `lab_settings` (
                `labId`, `labName`, `tagline`, `logoUrl`, `phone`, `email`, `address`, `city`,
                `state`, `pincode`, `brandColor`, `secondaryColor`, `upiId`, `upiMerchantName`,
                `whatsappNumber`, `supportPhone`, `autoSendWhatsApp`, `status`, `isWebsiteApproved`, `settingsJson`
            ) VALUES (
                :labId, :labName, :tagline, :logoUrl, :phone, :email, :address, :city,
                :state, :pincode, :brandColor, :secondaryColor, :upiId, :upiMerchantName,
                :whatsappNumber, :supportPhone, :autoSendWhatsApp, :status, :isWebsiteApproved, :settingsJson
            )");
            $stmt->execute([
                ':labId' => $id,
                ':labName' => $data['labName'] ?? ($data['name'] ?? 'Diagnostic Lab'),
                ':tagline' => $data['tagline'] ?? null,
                ':logoUrl' => $data['logoUrl'] ?? null,
                ':phone' => $data['phone'] ?? null,
                ':email' => $data['email'] ?? null,
                ':address' => $data['address'] ?? null,
                ':city' => $data['city'] ?? null,
                ':state' => $data['state'] ?? null,
                ':pincode' => $data['pincode'] ?? null,
                ':brandColor' => $data['brandColor'] ?? '#123B6D',
                ':secondaryColor' => $data['secondaryColor'] ?? '#0F766E',
                ':upiId' => $data['upiId1'] ?? ($data['upiId'] ?? null),
                ':upiMerchantName' => $data['merchantName'] ?? ($data['upiMerchantName'] ?? null),
                ':whatsappNumber' => $data['whatsapp'] ?? ($data['whatsappNumber'] ?? null),
                ':supportPhone' => $data['helplinePhone'] ?? ($data['supportPhone'] ?? null),
                ':autoSendWhatsApp' => 1,
                ':status' => $data['status'] ?? 'Active',
                ':isWebsiteApproved' => !empty($data['isWebsiteApproved']) ? 1 : 0,
                ':settingsJson' => json_encode($data, JSON_UNESCAPED_UNICODE)
            ]);
            return true;
        }

        if ($collection === 'reception_entries') {
            $stmt = $pdo->prepare("REPLACE INTO `lab_reception_entries` (
                `id`, `labId`, `branchId`, `tokenNumber`, `uhid`, `barcode`, `patientName`,
                `patientAge`, `patientGender`, `patientMobile`, `patientEmail`, `patientAddress`,
                `referredBy`, `selectedTests`, `totalAmount`, `paidAmount`, `dueAmount`, `discount`,
                `paymentMethod`, `paymentStatus`, `status`, `registeredAt`, `sampleCollectedAt`,
                `resultsEnteredAt`, `signedAt`, `deliveredAt`, `notes`, `data`
            ) VALUES (
                :id, :labId, :branchId, :tokenNumber, :uhid, :barcode, :patientName,
                :patientAge, :patientGender, :patientMobile, :patientEmail, :patientAddress,
                :referredBy, :selectedTests, :totalAmount, :paidAmount, :dueAmount, :discount,
                :paymentMethod, :paymentStatus, :status, :registeredAt, :sampleCollectedAt,
                :resultsEnteredAt, :signedAt, :deliveredAt, :notes, :data
            )");
            $stmt->execute([
                ':id' => $id,
                ':labId' => $data['labId'] ?? 'lab-apex',
                ':branchId' => $data['branchId'] ?? null,
                ':tokenNumber' => $data['tokenNumber'] ?? ($data['tokenNo'] ?? $id),
                ':uhid' => $data['uhid'] ?? '',
                ':barcode' => $data['barcode'] ?? null,
                ':patientName' => $data['patientName'] ?? 'Walk-In Patient',
                ':patientAge' => isset($data['patientAge']) ? (int)$data['patientAge'] : null,
                ':patientGender' => $data['patientGender'] ?? 'Other',
                ':patientMobile' => $data['patientMobile'] ?? ($data['mobile'] ?? ''),
                ':patientEmail' => $data['patientEmail'] ?? null,
                ':patientAddress' => $data['patientAddress'] ?? null,
                ':referredBy' => $data['referredBy'] ?? 'Self Walk-In',
                ':selectedTests' => json_encode($data['selectedTests'] ?? [], JSON_UNESCAPED_UNICODE),
                ':totalAmount' => (float)($data['totalAmount'] ?? ($data['total'] ?? 0)),
                ':paidAmount' => (float)($data['paidAmount'] ?? ($data['paid'] ?? 0)),
                ':dueAmount' => (float)($data['dueAmount'] ?? 0),
                ':discount' => (float)($data['discount'] ?? 0),
                ':paymentMethod' => $data['paymentMethod'] ?? 'Cash',
                ':paymentStatus' => $data['paymentStatus'] ?? 'Full Payment',
                ':status' => $data['status'] ?? 'Registered',
                ':registeredAt' => $data['registeredAt'] ?? date('c'),
                ':sampleCollectedAt' => $data['sampleCollectedAt'] ?? null,
                ':resultsEnteredAt' => $data['resultsEnteredAt'] ?? null,
                ':signedAt' => $data['signedAt'] ?? null,
                ':deliveredAt' => $data['deliveredAt'] ?? null,
                ':notes' => $data['notes'] ?? null,
                ':data' => json_encode($data, JSON_UNESCAPED_UNICODE)
            ]);
            return true;
        }

        if ($collection === 'lab_reports') {
            $stmt = $pdo->prepare("REPLACE INTO `lab_reports` (
                `reportId`, `labId`, `branchId`, `receptionId`, `tokenNumber`, `uhid`,
                `patientName`, `patientAge`, `patientGender`, `patientMobile`, `referredBy`,
                `testName`, `category`, `status`, `collectedDate`, `reportedDate`, `sampleType`,
                `parameters`, `notes`, `data`
            ) VALUES (
                :reportId, :labId, :branchId, :receptionId, :tokenNumber, :uhid,
                :patientName, :patientAge, :patientGender, :patientMobile, :referredBy,
                :testName, :category, :status, :collectedDate, :reportedDate, :sampleType,
                :parameters, :notes, :data
            )");
            $stmt->execute([
                ':reportId' => $id,
                ':labId' => $data['labId'] ?? 'lab-apex',
                ':branchId' => $data['branchId'] ?? null,
                ':receptionId' => $data['receptionId'] ?? null,
                ':tokenNumber' => $data['tokenNumber'] ?? null,
                ':uhid' => $data['uhid'] ?? '',
                ':patientName' => $data['patientName'] ?? 'Patient',
                ':patientAge' => isset($data['patientAge']) ? (int)$data['patientAge'] : null,
                ':patientGender' => $data['patientGender'] ?? 'Other',
                ':patientMobile' => $data['patientMobile'] ?? ($data['mobile'] ?? ''),
                ':referredBy' => $data['referredBy'] ?? 'Self Walk-In',
                ':testName' => $data['testName'] ?? 'Diagnostic Test',
                ':category' => $data['category'] ?? 'General',
                ':status' => $data['status'] ?? 'Approved',
                ':collectedDate' => $data['collectedDate'] ?? date('Y-m-d'),
                ':reportedDate' => $data['reportedDate'] ?? date('Y-m-d'),
                ':sampleType' => $data['sampleType'] ?? null,
                ':parameters' => json_encode($data['parameters'] ?? [], JSON_UNESCAPED_UNICODE),
                ':notes' => $data['notes'] ?? null,
                ':data' => json_encode($data, JSON_UNESCAPED_UNICODE)
            ]);
            return true;
        }

        // Generic fallback insert for other MySQL tables using data column
        $jsonStr = json_encode($data, JSON_UNESCAPED_UNICODE);
        $checkCol = $pdo->query("SHOW COLUMNS FROM `{$tableName}` LIKE 'data'");
        if ($checkCol && $checkCol->rowCount() > 0) {
            $stmt = $pdo->prepare("REPLACE INTO `{$tableName}` (`{$idCol}`, `data`) VALUES (:id, :data)");
            $stmt->execute([':id' => $id, ':data' => $jsonStr]);
            return true;
        }
    } catch (Exception $e) {
        // Silently continue with file fallback
    }
    return false;
}

/**
 * Delete document from Hostinger MySQL
 */
function deleteDocFromMySql($collection, $id) {
    global $pdo, $TABLE_MAP;
    if (!$pdo || !isset($TABLE_MAP[$collection])) return false;

    $meta = $TABLE_MAP[$collection];
    $tableName = $meta['table'];
    $idCol = $meta['id'];

    try {
        $stmt = $pdo->prepare("DELETE FROM `{$tableName}` WHERE `{$idCol}` = :id");
        $stmt->execute([':id' => $id]);
        return true;
    } catch (Exception $e) {
        return false;
    }
}

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
            $updatedCollections = array_keys($TABLE_MAP);
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
        $data = fetchCollectionData($collection);
        $resp = [
            'status' => 'success',
            'collection' => $collection,
            'data' => $data,
            'serverTime' => round(microtime(true) * 1000)
        ];
        if ($collection === 'lab_settings' && is_array($data)) {
            $map = [];
            foreach ($data as $item) {
                $lid = $item['labId'] ?? ($item['id'] ?? '');
                if ($lid) $map[$lid] = $item;
            }
            $resp['map'] = $map;
        }
        echo json_encode($resp);
        exit();
    }

    // Default GET: Fetch all active collections
    $allData = [];
    foreach (array_keys($TABLE_MAP) as $col) {
        $allData[$col] = fetchCollectionData($col);
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
// POST Requests: Save, Delete, Batch Save, Seed
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

        // 1. Persist to MySQL
        persistDocToMySql($collection, $id, $itemData);

        // 2. Persist to JSON file storage (guaranteed failover)
        $currentList = readCollectionFile($collection);
        $found = false;

        for ($i = 0; $i < count($currentList); $i++) {
            $existingId = $currentList[$i]['id'] ?? ($currentList[$i]['reportId'] ?? ($currentList[$i]['labId'] ?? ''));
            if ($existingId == $id) {
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
            'storageMode' => getStorageMode(),
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

        // 1. Delete from MySQL
        deleteDocFromMySql($collection, $id);

        // 2. Delete from JSON file storage
        $currentList = readCollectionFile($collection);
        $newList = [];

        foreach ($currentList as $item) {
            $itemId = $item['id'] ?? ($item['reportId'] ?? ($item['labId'] ?? ''));
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
            'storageMode' => getStorageMode(),
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

        foreach ($items as $newItem) {
            $newId = $newItem['id'] ?? ($newItem['reportId'] ?? ($newItem['labId'] ?? ''));
            if ($newId) {
                persistDocToMySql($collection, (string)$newId, $newItem);
            }
        }

        $currentList = readCollectionFile($collection);
        $map = [];
        foreach ($currentList as $it) {
            $itId = $it['id'] ?? ($it['reportId'] ?? ($it['labId'] ?? ''));
            if ($itId) $map[$itId] = $it;
        }

        foreach ($items as $newItem) {
            $newId = $newItem['id'] ?? ($newItem['reportId'] ?? ($newItem['labId'] ?? ''));
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
            'storageMode' => getStorageMode(),
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
                        foreach ($colItems as $item) {
                            $itemId = $item['id'] ?? ($item['reportId'] ?? ($item['labId'] ?? ''));
                            if ($itemId) {
                                persistDocToMySql($colName, (string)$itemId, $item);
                            }
                        }
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
