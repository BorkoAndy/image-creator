<?php

/**
 * save.php — receives approved base64 image from frontend, saves to /files/
 * Called only after user clicks "Approve" in the UI.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Config
$CONTAO_ROOT = dirname(__DIR__, 2); // Assuming save.php is in web/image-generator/
$FILES_DIR = '/files/'; // Relative to Contao root
$ABSOLUTE_FILES_DIR = $CONTAO_ROOT . $FILES_DIR;

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

// Prepare uploads directory
if (!is_dir($ABSOLUTE_FILES_DIR)) {
    @mkdir($ABSOLUTE_FILES_DIR, 0755, true);
}

// Generate filename: timestamp + sanitized prompt slug
$timestamp = date('Ymd_His');
$slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($prompt));
$slug = trim(substr($slug, 0, 40), '-');
$filename = "{$timestamp}_{$slug}.png";
$filepath = $ABSOLUTE_FILES_DIR . $filename;

// Save file
$written = file_put_contents($filepath, $imageBytes);
if ($written === false) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to write file to disk. Check permissions on ' . $ABSOLUTE_FILES_DIR
    ]);
    exit;
}

// Return the path relative to Contao root for the DB field
$contatoPath = trim($FILES_DIR, '/') . '/' . $filename;

// Success
echo json_encode([
    'status'   => 'ok',
    'filename' => $filename,
    'path'     => $contatoPath,
    'size'     => $written,
]);
