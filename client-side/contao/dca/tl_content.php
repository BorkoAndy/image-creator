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
 */
if (isset($_GET['action']) && $_GET['action'] === 'ai_save_image') {
    $container = System::getContainer();
    $request = $container->get('request_stack')->getCurrentRequest() ?? Request::createFromGlobals();
    
    // Parse body
    $data = json_decode($request->getContent(), true);
    if (!$data || empty($data['image'])) {
        (new JsonResponse(['status' => 'error', 'message' => 'Missing image data']))->send();
        exit;
    }

    $base64 = $data['image'];
    $prompt = isset($data['prompt']) ? substr($data['prompt'], 0, 100) : 'unknown';
    $imageBytes = base64_decode($base64);

    // Prepare path
    $folder = 'files';
    if (!is_dir(System::getContainer()->getParameter('kernel.project_dir') . '/' . $folder)) {
        mkdir(System::getContainer()->getParameter('kernel.project_dir') . '/' . $folder, 0755, true);
    }

    $filename = date('Ymd_His') . '_' . StringUtil::generateAlias($prompt) . '.png';
    $path = $folder . '/' . $filename;

    // Save file
    $file = new File($path);
    $file->write($imageBytes);
    $file->close();

    // Register in DBAFS to get a UUID
    $model = Dbafs::addResource($path);

    (new JsonResponse([
        'status' => 'ok',
        'path'   => $path,
        'uuid'   => StringUtil::binToUuid($model->uuid),
        'filename' => $filename
    ]))->send();
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
