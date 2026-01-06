/**
 * Extracts a zip file to a temporary directory
 * @param zipPath - Path to the zip file
 * @returns Path to the extracted directory
 * @throws Error if zip file doesn't exist or extraction fails
 */
export declare function extractZip(zipPath: string): Promise<string>;
/**
 * Cleans up the temporary extraction directory
 * @param tempDir - Path to the temporary directory to remove
 */
export declare function cleanupTempDir(tempDir: string): void;
