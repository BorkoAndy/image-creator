<?php

/**
 * Contao Open Source CMS
 *
 * Copyright (c) 2005-2024 Leo Feyer
 *
 * @package   image-creator
 * @author    Antigravity AI
 * @license   LGPL
 * @copyright Antigravity AI 2024
 */

use Contao\System;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Contao\File;
use Contao\Files;
use Contao\Dbafs;
use Contao\StringUtil;

/**
 * AJAX Handler for saving the AI image directly into Contao's DBAFS
 * We check this early to avoid rendering the rest of the backend page.
 */
if (isset($_GET['action']) && $_GET['action'] === 'ai_save_image') {
    // Ensure we don't have any previous output (buffer cleanup)
    while (ob_get_level()) ob_end_clean();
    header('Content-Type: application/json');

    try {
        $container = System::getContainer();
        $request = $container->get('request_stack')->getCurrentRequest() ?? Request::createFromGlobals();
        
        // Parse body
        $data = json_decode($request->getContent(), true);
        if (!$data || empty($data['image'])) {
            echo json_encode(['status' => 'error', 'message' => 'Missing image data']);
            exit;
        }

        $base64 = $data['image'];
        $prompt = isset($data['prompt']) ? substr($data['prompt'], 0, 100) : 'unknown';
        $imageBytes = base64_decode($base64);

        // Prepare path - Saving to /files/ai-generated/ for grouping
        $folder = 'files/ai-generated';
        $projectDir = $container->getParameter('kernel.project_dir');
        
        if (!is_dir($projectDir . '/' . $folder)) {
            mkdir($projectDir . '/' . $folder, 0755, true);
        }

        $alias = StringUtil::generateAlias($prompt);
        $filename = date('Ymd_His') . '_' . ($alias ?: 'ai-image') . '.png';
        $path = $folder . '/' . $filename;

        // Save file using native PHP for maximum reliability
        file_put_contents($projectDir . '/' . $path, $imageBytes);

        // Register in DBAFS to get a UUID
        $model = Dbafs::addResource($path);

        echo json_encode([
            'status' => 'ok',
            'path'   => $path,
            'uuid'   => StringUtil::binToUuid($model->uuid),
            'filename' => $filename
        ]);
    } catch (\Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

/**
 * Inject the AI scripts into the backend
 */
try {
    $container = System::getContainer();
    $request = $container->get('request_stack')->getCurrentRequest() ?? Request::createFromGlobals();
    $scopeMatcher = $container->get('contao.routing.scope_matcher');

    if ($scopeMatcher->isBackendRequest($request)) {
        // Keep the existing Alt-Text generator script
        $GLOBALS['TL_JAVASCRIPT'][] = 'js/contao-alt-generator.js';

        // Load the Image Generator script
        $GLOBALS['TL_JAVASCRIPT'][] = 'js/contao-ai-image-generator.js';
    }
} catch (\Exception $e) {
    // Fallback
    $GLOBALS['TL_JAVASCRIPT'][] = 'js/contao-alt-generator.js';
    $GLOBALS['TL_JAVASCRIPT'][] = 'js/contao-ai-image-generator.js';
}
