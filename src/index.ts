#!/usr/bin/env node

import { program } from "commander";
import * as os from "os";
import * as path from "path";
import { discoverTokenFiles, getRelativePath } from "./discover.js";
import { logger } from "./logger.js";
import { transformTokens } from "./transform.js";
import type { CLIOptions } from "./types.js";
import { cleanupTempDir, extractZip } from "./unzip.js";

// Default output directory
const DEFAULT_OUTPUT_DIR = path.join(os.homedir(), "Downloads");

/**
 * Main entry point for the CLI
 */
async function main(): Promise<void> {
  // Configure CLI
  program
    .name("design-tokens")
    .description("Transform design tokens from JSON to CSS variables")
    .version("1.0.0")
    .argument("<zipFile>", "Path to the zip file containing design tokens")
    .option(
      "-o, --out <directory>",
      "Output directory for generated CSS files",
      DEFAULT_OUTPUT_DIR
    )
    .action(async (zipFile: string, options: { out: string }) => {
      await run({ zipPath: zipFile, outputDir: options.out });
    });

  // Parse arguments
  await program.parseAsync(process.argv);
}

/**
 * Runs the token transformation process
 */
async function run(options: CLIOptions): Promise<void> {
  let tempDir: string | null = null;

  try {
    // Step 1: Extract the zip file
    tempDir = await extractZip(options.zipPath);

    // Step 2: Discover token files
    const discoveredFiles = discoverTokenFiles(tempDir);

    // Validate we have files to process
    const totalFilesToProcess =
      discoveredFiles.outputFiles.length + discoveredFiles.themeFiles.length;
    if (totalFilesToProcess === 0) {
      logger.warn("No files to transform. Exiting.");
      return;
    }

    // Step 3: Transform tokens to CSS
    const { results, stats } = await transformTokens(
      discoveredFiles,
      options.outputDir
    );

    // Step 4: Print summary
    logger.newline();
    logger.summary({
      referenceFiles: discoveredFiles.referenceFiles.map((f) =>
        getRelativePath(f, tempDir!)
      ),
      inputFiles: [
        ...discoveredFiles.outputFiles.map((f) => getRelativePath(f, tempDir!)),
        ...discoveredFiles.themeFiles.map((f) => getRelativePath(f, tempDir!)),
      ],
      outputFiles: results.map((r) => ({
        path: r.outputPath,
        tokenCount: r.tokenCount,
      })),
      tokensProcessed: stats.tokensProcessed,
      tokensSkipped: stats.tokensSkipped,
    });

    // Success message
    logger.success(
      `Generated ${results.length} CSS file(s) in ${options.outputDir}`
    );
  } catch (error) {
    // Handle errors with detailed output
    if (error instanceof Error) {
      logger.error("Transformation failed", error);

      // Provide helpful hints based on error type
      if (error.message.includes("not found")) {
        logger.info("Hint: Check that the zip file path is correct");
      } else if (error.message.includes("No token files found")) {
        logger.info(
          "Hint: Token files must have .inp.json or .ref.inp.json extension"
        );
      } else if (error.message.includes("Failed to extract")) {
        logger.info("Hint: Ensure the file is a valid zip archive");
      }
    } else {
      logger.error("An unexpected error occurred");
    }

    process.exit(1);
  } finally {
    // Cleanup: Remove temporary directory
    if (tempDir) {
      cleanupTempDir(tempDir);
    }
  }
}

// Run the CLI
main().catch((error) => {
  logger.error("Fatal error", error instanceof Error ? error : undefined);
  process.exit(1);
});
