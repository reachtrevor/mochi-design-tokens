/**
 * Logger utility for consistent, colored console output
 */
export declare const logger: {
    /**
     * Log an informational message (cyan)
     */
    info(message: string): void;
    /**
     * Log a success message (green)
     */
    success(message: string): void;
    /**
     * Log a warning message (yellow)
     */
    warn(message: string): void;
    /**
     * Log an error message (red)
     */
    error(message: string, error?: Error): void;
    /**
     * Log a debug message (gray) - only shown when DEBUG env var is set
     */
    debug(message: string): void;
    /**
     * Print a blank line for spacing
     */
    newline(): void;
    /**
     * Print the processing summary
     */
    summary(data: {
        referenceFiles: string[];
        inputFiles: string[];
        outputFiles: Array<{
            path: string;
            tokenCount: number;
        }>;
        tokensProcessed: number;
        tokensSkipped: number;
    }): void;
};
