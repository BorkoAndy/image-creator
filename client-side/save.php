<?php
/**
 * save.php — receives approved base64 image from frontend, saves to /uploads/
 * Called only after user clicks "Approve" in the UI.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Parse body
$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!$data || empty($data['image'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing image data']);
    exit;
}

$base64 = $data['image'];
$prompt = isset($data['prompt']) ? substr($data['prompt'], 0, 100) : 'unknown';

// Decode base64
$imageBytes = base64_decode($base64, true);
if ($imageBytes === false) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid base64 image data']);
    exit;
}

// Validate it's actually a PNG (check magic bytes)
if (substr($imageBytes, 0, 8) !== "\x89PNG\r\n\x1a\n") {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid image format — expected PNG']);
    exit;
}

// Prepare uploads directory
$uploadsDir = __DIR__ . '/uploads/';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// Generate filename: timestamp + sanitized prompt slug
$timestamp = date('Ymd_His');
$slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($prompt));
$slug = trim(substr($slug, 0, 40), '-');
$filename = "{$timestamp}_{$slug}.png";
$filepath = $uploadsDir . $filename;

// Save file
$written = file_put_contents($filepath, $imageBytes);
if ($written === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to write file to disk']);
    exit;
}

// Success
echo json_encode([
    'status'   => 'ok',
    'filename' => $filename,
    'path'     => 'uploads/' . $filename,
    'size'     => $written,
]);
