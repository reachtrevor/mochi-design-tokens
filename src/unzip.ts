import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { logger } from './logger.js';

/**
 * Extracts a zip file to a temporary directory
 * @param zipPath - Path to the zip file
 * @returns Path to the extracted directory
 * @throws Error if zip file doesn't exist or extraction fails
 */
export async function extractZip(zipPath: string): Promise<string> {
  // Resolve the path (handle ~ for home directory)
  const resolvedPath = zipPath.startsWith('~')
    ? path.join(os.homedir(), zipPath.slice(1))
    : path.resolve(zipPath);

  logger.debug(`Resolved zip path: ${resolvedPath}`);

  // Validate zip file exists
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Zip file not found: ${resolvedPath}`);
  }

  // Validate it's a file
  const stats = fs.statSync(resolvedPath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${resolvedPath}`);
  }

  // Validate it has .zip extension
  if (!resolvedPath.toLowerCase().endsWith('.zip')) {
    throw new Error(`File does not have .zip extension: ${resolvedPath}`);
  }

  // Create a unique temporary directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'design-tokens-'));
  logger.debug(`Created temp directory: ${tempDir}`);

  try {
    logger.info(`Extracting: ${resolvedPath}`);

    const zip = new AdmZip(resolvedPath);

    // Get list of entries for validation
    const entries = zip.getEntries();
    if (entries.length === 0) {
      throw new Error('Zip file is empty');
    }

    logger.debug(`Found ${entries.length} entries in zip`);

    // Extract all files
    zip.extractAllTo(tempDir, true);

    logger.debug(`Extraction complete to: ${tempDir}`);

    return tempDir;
  } catch (error) {
    // Clean up temp directory on failure
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    if (error instanceof Error) {
      throw new Error(`Failed to extract zip file: ${error.message}`);
    }
    throw new Error('Failed to extract zip file: Unknown error');
  }
}

/**
 * Cleans up the temporary extraction directory
 * @param tempDir - Path to the temporary directory to remove
 */
export function cleanupTempDir(tempDir: string): void {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      logger.debug(`Cleaned up temp directory: ${tempDir}`);
    }
  } catch (error) {
    logger.warn(`Failed to cleanup temp directory: ${tempDir}`);
  }
}

