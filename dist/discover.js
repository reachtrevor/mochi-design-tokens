import * as fs from "fs";
import * as path from "path";
import { logger } from "./logger.js";
/**
 * File patterns for token files
 */
const OUTPUT_PATTERN = /\.inp\.json$/;
const REFERENCE_PATTERN = /\.ref\.inp\.json$/;
const THEME_PATTERN = /\.theme\.inp\.json$/;
/**
 * Recursively finds all files matching a pattern in a directory
 */
function findFilesRecursive(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            findFilesRecursive(fullPath, files);
        }
        else if (entry.isFile()) {
            files.push(fullPath);
        }
    }
    return files;
}
/**
 * Discovers and categorizes token files in the extracted directory
 *
 * Files are categorized based on naming convention:
 * - *.ref.inp.json -> Reference files (loaded but no output generated)
 * - *.theme.inp.json -> Theme files (CSS with Mantine color scheme selector)
 * - *.inp.json -> Standard output files (CSS with :root selector)
 *
 * @param extractedDir - Path to the extracted directory
 * @returns Object containing categorized file paths
 * @throws Error if no token files are found
 */
export function discoverTokenFiles(extractedDir) {
    logger.debug(`Discovering token files in: ${extractedDir}`);
    if (!fs.existsSync(extractedDir)) {
        throw new Error(`Directory does not exist: ${extractedDir}`);
    }
    // Find all files recursively
    const allFoundFiles = findFilesRecursive(extractedDir);
    logger.debug(`Found ${allFoundFiles.length} total files`);
    // Categorize files based on naming convention
    const referenceFiles = [];
    const themeFiles = [];
    const outputFiles = [];
    for (const file of allFoundFiles) {
        const fileName = path.basename(file);
        // Check for reference files first (most specific pattern)
        if (REFERENCE_PATTERN.test(fileName)) {
            referenceFiles.push(file);
            logger.debug(`Reference file: ${file}`);
        }
        // Check for theme files (*.theme.inp.json)
        else if (THEME_PATTERN.test(fileName)) {
            themeFiles.push(file);
            logger.debug(`Theme file: ${file}`);
        }
        // Standard output files (*.inp.json but not *.ref.inp.json or *.theme.inp.json)
        else if (OUTPUT_PATTERN.test(fileName)) {
            outputFiles.push(file);
            logger.debug(`Output file: ${file}`);
        }
    }
    // Validate we found at least some token files
    const totalTokenFiles = referenceFiles.length + themeFiles.length + outputFiles.length;
    if (totalTokenFiles === 0) {
        throw new Error("No token files found. Token files must have .inp.json, .theme.inp.json, or .ref.inp.json extension.");
    }
    const totalOutputFiles = outputFiles.length + themeFiles.length;
    // Warn if no output files found
    if (totalOutputFiles === 0) {
        logger.warn("No output files found. Only reference files (*.ref.inp.json) were discovered.");
    }
    // Log discovery results
    logger.info(`Found ${totalTokenFiles} token files (${referenceFiles.length} reference-only, ${themeFiles.length} themes, ${outputFiles.length} standard)`);
    // Log reference files
    for (const file of referenceFiles) {
        const relativePath = path.relative(extractedDir, file);
        logger.info(`Loading reference: ${relativePath}`);
    }
    return {
        outputFiles,
        themeFiles,
        referenceFiles,
        allFiles: [...referenceFiles, ...themeFiles, ...outputFiles],
    };
}
/**
 * Gets the output filename for a given input file
 * Transforms:
 *   - name.inp.json -> name.vars.gen.css
 *   - name.theme.inp.json -> name.vars.gen.css
 *
 * @param inputPath - Path to the input file
 * @returns The output filename (not full path)
 */
export function getOutputFileName(inputPath) {
    const basename = path.basename(inputPath);
    // Remove .theme.inp.json or .inp.json suffix and add .vars.gen.css
    const name = basename.replace(/\.(theme\.)?inp\.json$/, "");
    return `${name}.vars.gen.css`;
}
/**
 * Gets the theme name from a theme file path
 * Extracts: name.theme.inp.json -> name
 *
 * @param inputPath - Path to the theme file
 * @returns The theme name (e.g., "light", "dark")
 */
export function getThemeName(inputPath) {
    const basename = path.basename(inputPath);
    return basename.replace(/\.theme\.inp\.json$/, "");
}
/**
 * Checks if a file is a theme file
 */
export function isThemeFile(inputPath) {
    return THEME_PATTERN.test(path.basename(inputPath));
}
/**
 * Gets relative path from extracted directory for display purposes
 */
export function getRelativePath(filePath, extractedDir) {
    return path.relative(extractedDir, filePath);
}
