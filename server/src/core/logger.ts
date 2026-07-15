type LogLevel = "info" | "warn" | "error" | "debug";

const colors: Record<LogLevel, string> = {
    info: "\x1b[36m",
    warn: "\x1b[33m",
    error: "\x1b[31m",
    debug: "\x1b[90m",
};
const reset = "\x1b[0m";

function timestamp(): string {
    return new Date().toISOString();
}

export const logger = {
    info(message: string, ...args: unknown[]) {
        console.log(`${colors.info}[${timestamp()}] [INFO]${reset} ${message}`, ...args);
    },
    warn(message: string, ...args: unknown[]) {
        console.warn(`${colors.warn}[${timestamp()}] [WARN]${reset} ${message}`, ...args);
    },
    error(message: string, ...args: unknown[]) {
        console.error(`${colors.error}[${timestamp()}] [ERROR]${reset} ${message}`, ...args);
    },
    debug(message: string, ...args: unknown[]) {
        if (process.env.NODE_ENV === "development") {
            console.debug(`${colors.debug}[${timestamp()}] [DEBUG]${reset} ${message}`, ...args);
        }
    },
};
