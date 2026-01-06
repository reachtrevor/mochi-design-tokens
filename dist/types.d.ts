/**
 * Result of discovering token files in the extracted directory
 */
export interface DiscoveredFiles {
    /** Standard output files (*.inp.json, excluding *.ref.inp.json and *.theme.inp.json) */
    outputFiles: string[];
    /** Theme files that use Mantine color scheme selector (*.theme.inp.json) */
    themeFiles: string[];
    /** Reference-only files used for resolving token references (*.ref.inp.json) */
    referenceFiles: string[];
    /** All token files combined (for Style Dictionary sources) */
    allFiles: string[];
}
/**
 * Statistics about processed tokens
 */
export interface ProcessingStats {
    /** Total number of tokens processed across all files */
    tokensProcessed: number;
    /** Number of tokens that were skipped */
    tokensSkipped: number;
    /** Map of output file path to token count */
    outputTokenCounts: Map<string, number>;
}
/**
 * Result of the transformation process
 */
export interface TransformResult {
    /** Path to the generated CSS file */
    outputPath: string;
    /** Number of tokens in this file */
    tokenCount: number;
    /** Original input file path */
    inputPath: string;
}
/**
 * CLI options parsed from command line arguments
 */
export interface CLIOptions {
    /** Path to the input zip file */
    zipPath: string;
    /** Output directory for generated CSS files */
    outputDir: string;
}
