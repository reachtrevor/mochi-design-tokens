import type { DiscoveredFiles } from "./types.js";
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
export declare function discoverTokenFiles(extractedDir: string): DiscoveredFiles;
/**
 * Gets the output filename for a given input file
 * Transforms:
 *   - name.inp.json -> name.vars.gen.css
 *   - name.theme.inp.json -> name.vars.gen.css
 *
 * @param inputPath - Path to the input file
 * @returns The output filename (not full path)
 */
export declare function getOutputFileName(inputPath: string): string;
/**
 * Gets the theme name from a theme file path
 * Extracts: name.theme.inp.json -> name
 *
 * @param inputPath - Path to the theme file
 * @returns The theme name (e.g., "light", "dark")
 */
export declare function getThemeName(inputPath: string): string;
/**
 * Checks if a file is a theme file
 */
export declare function isThemeFile(inputPath: string): boolean;
/**
 * Gets relative path from extracted directory for display purposes
 */
export declare function getRelativePath(filePath: string, extractedDir: string): string;
