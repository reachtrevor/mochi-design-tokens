import chalk from 'chalk';
/**
 * Logger utility for consistent, colored console output
 */
export const logger = {
    /**
     * Log an informational message (cyan)
     */
    info(message) {
        console.log(chalk.cyan('[INFO]'), message);
    },
    /**
     * Log a success message (green)
     */
    success(message) {
        console.log(chalk.green('[SUCCESS]'), message);
    },
    /**
     * Log a warning message (yellow)
     */
    warn(message) {
        console.log(chalk.yellow('[WARN]'), message);
    },
    /**
     * Log an error message (red)
     */
    error(message, error) {
        console.error(chalk.red('[ERROR]'), message);
        if (error) {
            console.error(chalk.red('  Details:'), error.message);
            if (error.stack) {
                console.error(chalk.dim(error.stack));
            }
        }
    },
    /**
     * Log a debug message (gray) - only shown when DEBUG env var is set
     */
    debug(message) {
        if (process.env.DEBUG) {
            console.log(chalk.gray('[DEBUG]'), message);
        }
    },
    /**
     * Print a blank line for spacing
     */
    newline() {
        console.log();
    },
    /**
     * Print the processing summary
     */
    summary(data) {
        console.log();
        console.log(chalk.bold.white('Summary:'));
        if (data.referenceFiles.length > 0) {
            console.log(chalk.gray('  Reference Files (no output):'));
            data.referenceFiles.forEach(file => {
                console.log(chalk.gray(`    - ${file}`));
            });
        }
        console.log(chalk.white('  Input Files:'));
        data.inputFiles.forEach(file => {
            console.log(chalk.white(`    - ${file}`));
        });
        console.log(chalk.green('  Output Files:'));
        data.outputFiles.forEach(({ path, tokenCount }) => {
            console.log(chalk.green(`    - ${path} (${tokenCount} tokens)`));
        });
        console.log(chalk.cyan(`  Tokens Processed: ${data.tokensProcessed}`));
        if (data.tokensSkipped > 0) {
            console.log(chalk.yellow(`  Tokens Skipped: ${data.tokensSkipped}`));
        }
        else {
            console.log(chalk.gray(`  Tokens Skipped: ${data.tokensSkipped}`));
        }
        console.log();
    }
};
