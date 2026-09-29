<?php
/**
 * INDIANLALAJI.COM - Hostinger Server Image & Asset Upload Endpoint
 * Saves uploaded images (logos, signatures, test images, banners) directly on Hostinger server.
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Only POST method is allowed']);
    exit();
}

$uploadDir = UPLOADS_DIR;
if (!file_exists($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

// 1. Handle Multipart Form-Data File Upload
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['file'];
    $originalName = $file['name'];
    $tmpName = $file['tmp_name'];
    $fileSize = $file['size'];

    // Validate size (max 20MB)
    if ($fileSize > 20 * 1024 * 1024) {
        echo json_encode(['status' => 'error', 'message' => 'File size exceeds 20MB limit']);
        exit();
    }

    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf'];

    if (!in_array($ext, $allowed)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid file extension. Allowed: jpg, jpeg, png, webp, svg, pdf']);
        exit();
    }

    $newFileName = 'img_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $destination = $uploadDir . '/' . $newFileName;

    if (move_uploaded_file($tmpName, $destination)) {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
        $host = $_SERVER['HTTP_HOST'] ?? 'indianlalaji.com';
        $publicUrl = '/uploads/' . $newFileName;
        $fullUrl = $protocol . $host . $publicUrl;

        echo json_encode([
            'status' => 'success',
            'url' => $publicUrl,
            'fullUrl' => $fullUrl,
            'filename' => $newFileName,
            'size' => $fileSize
        ]);
        exit();
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to move uploaded file to uploads directory']);
        exit();
    }
}

// 2. Handle JSON Base64 Data URL Image Upload
$input = file_get_contents('php://input');
$payload = json_decode($input, true);

if (is_array($payload) && !empty($payload['image'])) {
    $dataUrl = $payload['image'];
    $prefix = $payload['prefix'] ?? 'img';

    // Parse data URL: data:image/png;base64,iVBORw...
    if (preg_match('/^data:image\/(\w+);base64,/', $dataUrl, $type)) {
        $ext = strtolower($type[1]);
        if ($ext === 'jpeg') $ext = 'jpg';

        $data = substr($dataUrl, strpos($dataUrl, ',') + 1);
        $decoded = base64_decode($data);

        if ($decoded === false) {
            echo json_encode(['status' => 'error', 'message' => 'Base64 decode failed']);
            exit();
        }

        $newFileName = preg_replace('/[^a-zA-Z0-9_-]/', '', $prefix) . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $destination = $uploadDir . '/' . $newFileName;

        if (@file_put_contents($destination, $decoded)) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
            $host = $_SERVER['HTTP_HOST'] ?? 'indianlalaji.com';
            $publicUrl = '/uploads/' . $newFileName;
            $fullUrl = $protocol . $host . $publicUrl;

            echo json_encode([
                'status' => 'success',
                'url' => $publicUrl,
                'fullUrl' => $fullUrl,
                'filename' => $newFileName,
                'size' => strlen($decoded)
            ]);
            exit();
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to save decoded image file to uploads directory']);
            exit();
        }
    }
}

echo json_encode(['status' => 'error', 'message' => 'No valid file or base64 image provided']);
