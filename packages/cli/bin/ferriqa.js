#!/usr/bin/env bun

/**
 * Ferriqa CLI Entry Point
 *
 * Usage:
 *   ferriqa init [project-name]
 *   ferriqa dev
 *   ferriqa db migrate
 */

import { runCLI } from "../src/index.ts";

await runCLI();
