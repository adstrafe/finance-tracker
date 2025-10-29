import { AppError, ErrorCode } from '../errors';
import { ConsoleStyles, emojis } from '../utils/consoleStyles';

export enum LogLevel {
	ERROR = 0,
	WARN = 1,
	INFO = 2,
	DEBUG = 3
}

export interface LogContext {
	[key: string]: any;
}

export interface APICallContext {
	procedure: string;
	userId?: string;
	startTime: number;
	duration?: number;
	success?: boolean;
	error?: AppError;
	input?: any;
	output?: any;
}

export class Logger {
	private static logLevel: LogLevel;
	private static isDevelopment: boolean;

	static {
		Logger.isDevelopment = process.env.NODE_ENV === 'development';
		Logger.logLevel = Logger.getLogLevelFromEnv();
	}

	private static getLogLevelFromEnv(): LogLevel {
		const envLevel = process.env.LOG_LEVEL?.toUpperCase();
		switch (envLevel) {
			case 'ERROR': return LogLevel.ERROR;
			case 'WARN': return LogLevel.WARN;
			case 'INFO': return LogLevel.INFO;
			case 'DEBUG': return LogLevel.DEBUG;
			default: return Logger.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
		}
	}

	private static shouldLog(level: LogLevel): boolean {
		return level <= Logger.logLevel;
	}

	private static formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
		// Use styled console output for development, plain for production
		if (Logger.isDevelopment) {
			const levelName = LogLevel[level];
			const emoji = this.getEmojiForLevel(level);

			if (error) {
				return ConsoleStyles.errorDetails(error, context);
			}

			return ConsoleStyles.logEntry(levelName, message, emoji, context);
		}

		// Production: plain JSON format
		const timestamp = new Date().toISOString();
		const levelName = LogLevel[level];

		let formattedMessage = `[${timestamp}] ${levelName}: ${message}`;

		if (context && Object.keys(context).length > 0) {
			formattedMessage += ` | Context: ${JSON.stringify(context)}`;
		}

		if (error) {
			formattedMessage += ` | Error: ${error.message}`;
			if (error.stack) {
				formattedMessage += `\nStack: ${error.stack}`;
			}
		}

		return formattedMessage;
	}

	private static getEmojiForLevel(level: LogLevel): string {
		switch (level) {
			case LogLevel.ERROR: return emojis.error;
			case LogLevel.WARN: return emojis.warn;
			case LogLevel.INFO: return emojis.info;
			case LogLevel.DEBUG: return emojis.debug;
			default: return '📝';
		}
	}

	private static log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
		if (!Logger.shouldLog(level)) return;

		const formattedMessage = Logger.formatMessage(level, message, context, error);

		switch (level) {
			case LogLevel.ERROR:
				console.error(formattedMessage);
				break;
			case LogLevel.WARN:
				console.warn(formattedMessage);
				break;
			case LogLevel.INFO:
				console.info(formattedMessage);
				break;
			case LogLevel.DEBUG:
				console.debug(formattedMessage);
				break;
		}
	}

	static error(message: string, context?: LogContext, error?: Error): void {
		Logger.log(LogLevel.ERROR, message, context, error);
	}

	static warn(message: string, context?: LogContext): void {
		Logger.log(LogLevel.WARN, message, context);
	}

	static info(message: string, context?: LogContext): void {
		Logger.log(LogLevel.INFO, message, context);
	}

	static debug(message: string, context?: LogContext): void {
		Logger.log(LogLevel.DEBUG, message, context);
	}

	// API Call logging methods
	static apiCallStart(procedure: string, userId?: string, input?: any): APICallContext {
		const context: APICallContext = {
			procedure,
			userId,
			startTime: Date.now(),
			input: Logger.sanitizeInput(input)
		};

		// Use styled console output for development
		if (Logger.isDevelopment) {
			console.log(ConsoleStyles.apiCallStart(procedure, userId));
		} else {
			Logger.info(`API Call Started: ${procedure}`, {
				procedure,
				userId,
				inputKeys: input ? Object.keys(input) : []
			});
		}

		return context;
	}

	static apiCallEnd(context: APICallContext, success: boolean, output?: any, error?: AppError): void {
		const duration = Date.now() - context.startTime;
		context.duration = duration;
		context.success = success;
		context.output = success ? Logger.sanitizeOutput(output) : undefined;
		context.error = error;

		// Use styled console output for development
		if (Logger.isDevelopment) {
			console.log(ConsoleStyles.apiCallEnd(context.procedure, success, duration, context.userId));

			// Log error details if there's an error
			if (error) {
				console.log(ConsoleStyles.errorDetails(error, {
					procedure: context.procedure,
					userId: context.userId,
					duration: `${duration}ms`
				}));
			}
		} else {
			const logLevel = success ? LogLevel.INFO : LogLevel.ERROR;
			const message = `API Call ${success ? 'Completed' : 'Failed'}: ${context.procedure}`;

			Logger.log(logLevel, message, {
				procedure: context.procedure,
				userId: context.userId,
				duration: `${duration}ms`,
				success,
				errorCode: error?.code,
				errorMessage: error?.message,
				outputKeys: success && output ? Object.keys(output) : undefined
			}, error);
		}
	}

	// Error logging with structured error handling
	static logError(error: unknown, context?: LogContext): AppError {
		if (error instanceof AppError) {
			Logger.error(`Application Error: ${error.message}`, {
				...context,
				errorCode: error.code,
				errorContext: error.context,
				isOperational: error.isOperational
			}, error);
			return error;
		}

		if (error instanceof Error) {
			const appError = new AppError(
				error.message,
				ErrorCode.INTERNAL_SERVER_ERROR,
				{ ...context, originalError: error.name },
				false
			);

			Logger.error(`Unexpected Error: ${error.message}`, {
				...context,
				errorCode: appError.code,
				originalError: error.name
			}, error);

			return appError;
		}

		const appError = new AppError(
			'Unknown error occurred',
			ErrorCode.INTERNAL_SERVER_ERROR,
			{ ...context, unknownError: String(error) },
			false
		);

		Logger.error('Unknown Error', {
			...context,
			errorCode: appError.code,
			unknownError: String(error)
		});

		return appError;
	}

	// Convenience methods for specific scenarios
	static trpcError(procedure: string, error: unknown, context?: LogContext): AppError {
		return Logger.logError(error, { procedure, ...context });
	}

	static dbOperation(operation: string, collection: string, context?: LogContext): void {
		// Use styled console output for development
		if (Logger.isDevelopment) {
			console.log(ConsoleStyles.dbOperation(operation, collection, context));
		} else {
			Logger.debug(`DB Operation: ${operation}`, { operation, collection, ...context });
		}
	}

	static auth(message: string, userId?: string, context?: LogContext): void {
		Logger.info(message, { userId, ...context });
	}

	// Input/Output sanitization for security
	private static sanitizeInput(input: any): any {
		if (!input || typeof input !== 'object') return input;

		const sanitized = { ...input };

		// Remove sensitive fields
		const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
		for (const field of sensitiveFields) {
			if (field in sanitized) {
				sanitized[field] = '[REDACTED]';
			}
		}

		return sanitized;
	}

	private static sanitizeOutput(output: any): any {
		if (!output || typeof output !== 'object') return output;

		// For now, just return the output as-is
		// In production, we might want to sanitize certain fields
		return output;
	}
}
