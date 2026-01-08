import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import StyleDictionary from "style-dictionary";
import { getOutputFileName, getThemeName } from "./discover.js";
import { logger } from "./logger.js";
import type {
  DiscoveredFiles,
  ProcessingStats,
  TransformResult,
} from "./types.js";

/**
 * Custom name transform that:
 * - Preserves existing dashes (e.g., "text-size" stays "text-size")
 * - Converts spaces to dashes (e.g., "Deep Sage" becomes "deep-sage")
 * - Lowercases all segments
 */
const CUSTOM_NAME_TRANSFORM = "name/kebab-with-spaces";

/**
 * Registers custom transforms with Style Dictionary
 */
function registerCustomTransforms(): void {
  StyleDictionary.registerTransform({
    name: CUSTOM_NAME_TRANSFORM,
    type: "name",
    transform: (token) => {
      // Get the full path of the token
      const pathSegments = token.path || [];

      // Transform each segment: lowercase and replace spaces with dashes
      const transformedSegments = pathSegments.map((segment) => {
        return String(segment).toLowerCase().replace(/\s+/g, "-");
      });

      return transformedSegments.join("-");
    },
  });

  logger.debug("Registered custom name transform");
}

/**
 * Resolves the output directory path, handling ~ for home directory
 */
function resolveOutputDir(outputDir: string): string {
  if (outputDir.startsWith("~")) {
    return path.join(os.homedir(), outputDir.slice(1));
  }
  return path.resolve(outputDir);
}

/**
 * Checks if a token object uses the legacy format (value/type instead of $value/$type)
 */
function hasLegacyTokenFormat(tokens: Record<string, unknown>): boolean {
  for (const value of Object.values(tokens)) {
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      // Check for legacy format: has 'value' but not '$value'
      if ("value" in obj && !("$value" in obj)) {
        return true;
      }
      // Recurse into nested objects
      if (hasLegacyTokenFormat(obj)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Validates that token files use W3C DTCG format
 * @throws Error if legacy format is detected
 */
function validateDTCGFormat(
  tokens: Record<string, unknown>,
  fileName: string
): void {
  if (hasLegacyTokenFormat(tokens)) {
    throw new Error(
      `Token file "${fileName}" is not in W3C DTCG format. ` +
        `Found legacy format using "value" and "type" properties. ` +
        `Please use "$value" and "$type" properties instead. ` +
        `See: https://tr.designtokens.org/format/`
    );
  }
}

/**
 * Counts the number of tokens in a dictionary
 */
function countTokens(tokens: Record<string, unknown>, count = 0): number {
  for (const value of Object.values(tokens)) {
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      // Check if this is a token (has $value property)
      if ("$value" in obj) {
        count++;
      } else {
        // Recurse into nested objects
        count = countTokens(obj, count);
      }
    }
  }
  return count;
}

/**
 * Extracts all token paths from a token dictionary
 * Returns a Set of dot-separated paths (e.g., "color.Sage.0")
 */
function extractTokenPaths(
  tokens: Record<string, unknown>,
  currentPath: string[] = [],
  paths: Set<string> = new Set()
): Set<string> {
  for (const [key, value] of Object.entries(tokens)) {
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const newPath = [...currentPath, key];

      // Check if this is a token (has $value property)
      if ("$value" in obj) {
        paths.add(newPath.join("."));
      } else {
        // Recurse into nested objects
        extractTokenPaths(obj, newPath, paths);
      }
    }
  }
  return paths;
}

/**
 * Transforms token files to CSS variables using Style Dictionary
 *
 * @param discoveredFiles - The categorized token files
 * @param outputDir - Directory to write CSS files to
 * @returns Array of transform results with output paths and token counts
 */
export async function transformTokens(
  discoveredFiles: DiscoveredFiles,
  outputDir: string
): Promise<{ results: TransformResult[]; stats: ProcessingStats }> {
  // Register custom transforms
  registerCustomTransforms();

  // Resolve output directory
  const resolvedOutputDir = resolveOutputDir(outputDir);

  // Ensure output directory exists
  if (!fs.existsSync(resolvedOutputDir)) {
    fs.mkdirSync(resolvedOutputDir, { recursive: true });
    logger.debug(`Created output directory: ${resolvedOutputDir}`);
  }

  const results: TransformResult[] = [];
  const stats: ProcessingStats = {
    tokensProcessed: 0,
    tokensSkipped: 0,
    outputTokenCounts: new Map(),
  };

  // Process standard output files (*.inp.json) with :root selector
  for (const inputFile of discoveredFiles.outputFiles) {
    try {
      const result = await processTokenFile(
        inputFile,
        discoveredFiles.allFiles,
        resolvedOutputDir,
        ":root" // Standard CSS selector
      );

      results.push(result);
      stats.tokensProcessed += result.tokenCount;
      stats.outputTokenCounts.set(result.outputPath, result.tokenCount);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Failed to process ${path.basename(inputFile)}: ${errorMessage}`
      );
      stats.tokensSkipped++;
    }
  }

  // Process theme files (*.theme.inp.json) with Mantine color scheme selector
  for (const inputFile of discoveredFiles.themeFiles) {
    try {
      const themeName = getThemeName(inputFile);
      const selector = `[data-mantine-color-scheme='${themeName}']`;

      const result = await processTokenFile(
        inputFile,
        discoveredFiles.allFiles,
        resolvedOutputDir,
        selector
      );

      results.push(result);
      stats.tokensProcessed += result.tokenCount;
      stats.outputTokenCounts.set(result.outputPath, result.tokenCount);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Failed to process ${path.basename(inputFile)}: ${errorMessage}`
      );
      stats.tokensSkipped++;
    }
  }

  return { results, stats };
}

/**
 * Processes a single token file with Style Dictionary
 *
 * @param inputFile - Path to the input JSON file
 * @param allSourceFiles - All source files for reference resolution
 * @param outputDir - Directory to write output CSS
 * @param selector - CSS selector to use (e.g., ':root' or '[data-mantine-color-scheme="dark"]')
 */
async function processTokenFile(
  inputFile: string,
  allSourceFiles: string[],
  outputDir: string,
  selector: string
): Promise<TransformResult> {
  const outputFileName = getOutputFileName(inputFile);
  const outputPath = path.join(outputDir, outputFileName);
  const inputFileName = path.basename(inputFile);

  logger.info(`Processing: ${inputFileName} -> ${outputFileName}`);

  // Read the input file to get token paths and count
  const inputContent = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

  // Validate W3C DTCG format
  validateDTCGFormat(inputContent, inputFileName);

  const tokenCount = countTokens(inputContent);

  // Extract all token paths from this specific file for filtering
  const tokenPathsInFile = extractTokenPaths(inputContent);

  // Create Style Dictionary configuration
  // Load all source files to resolve references, but filter output by token path
  const sd = new StyleDictionary({
    source: allSourceFiles,
    platforms: {
      css: {
        transformGroup: "css",
        transforms: [CUSTOM_NAME_TRANSFORM, "size/px", "color/css"],
        buildPath: outputDir.endsWith("/") ? outputDir : `${outputDir}/`,
        files: [
          {
            destination: outputFileName,
            format: "css/variables",
            options: {
              outputReferences: true,
              selector: selector,
            },
            filter: (token) => {
              // Filter by token path - only include tokens defined in this file
              // This works even when Style Dictionary has merged/collided tokens
              const tokenPath = token.path.join(".");
              return tokenPathsInFile.has(tokenPath);
            },
          },
        ],
      },
    },
    log: {
      // Suppress collision warnings since we handle filtering ourselves
      verbosity: "silent",
      warnings: "disabled",
    },
  });

  // Build the CSS file
  await sd.buildAllPlatforms();

  logger.debug(`Generated: ${outputPath} with ${tokenCount} tokens`);

  return {
    outputPath,
    tokenCount,
    inputPath: inputFile,
  };
}
