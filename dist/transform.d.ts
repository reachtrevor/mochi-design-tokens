import type { DiscoveredFiles, TransformResult, ProcessingStats } from './types.js';
/**
 * Transforms token files to CSS variables using Style Dictionary
 *
 * @param discoveredFiles - The categorized token files
 * @param outputDir - Directory to write CSS files to
 * @returns Array of transform results with output paths and token counts
 */
export declare function transformTokens(discoveredFiles: DiscoveredFiles, outputDir: string): Promise<{
    results: TransformResult[];
    stats: ProcessingStats;
}>;
