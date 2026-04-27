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
    // Fallback if container is not ready
    $GLOBALS['TL_JAVASCRIPT'][] = 'js/contao-alt-generator.js';
    $GLOBALS['TL_JAVASCRIPT'][] = 'js/contao-ai-image-generator.js';
}

// Add a hook to modify the HTML after the field is rendered (if used by other parts of your setup)
$GLOBALS['TL_HOOKS']['executePostActions'][] = ['tl_content_ai_image', 'addAiButtonToPage'];
