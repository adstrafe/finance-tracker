/**
 * Logger utility for structured logging
 */

import { getEnvVar } from './utils/getEnvVar';

const isDev = getEnvVar('NODE_ENV') === 'development' ? true : false;

type LogLevel = 'info' | 'warn' | 'error';

interface LogOptions {
	[key: string]: unknown;
}

/**
 * Checks if an object is a MongoDB collection or related object
 */
function isMongoObject(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	// Check for MongoDB collection indicators
	const str = value.toString();
	const hasMongoIndicators =
		str.includes('Collection') ||
		str.includes('MongoClient') ||
		str.includes('Db') ||
		str.includes('Topology') ||
		str.includes('SessionPool') ||
		('collectionName' in (value as Record<string, unknown>)) ||
		('dbName' in (value as Record<string, unknown>) && 's' in (value as Record<string, unknown>));

	return hasMongoIndicators;
}

/**
 * Filters out sensitive fields from objects
 */
function filterSensitiveFields(key: string, value: unknown): unknown {
	const sensitiveKeys = ['password', 'credentials', 'connectionString', 'url', 'token', 'secret', 'apiKey'];
	if (typeof key === 'string' && sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
		return '[Redacted]';
	}
	return value;
}

/**
 * Safely stringifies an object, handling circular references and filtering sensitive data
 */
function safeStringify(obj: unknown, space?: number): string {
	const seen = new WeakSet();

	const replacer = (key: string, value: unknown): unknown => {
		// Filter sensitive fields first
		value = filterSensitiveFields(key, value);

		// Exclude MongoDB objects entirely
		if (isMongoObject(value)) {
			return '[MongoDB Object]';
		}

		// Handle circular references
		if (typeof value === 'object' && value !== null) {
			if (seen.has(value)) {
				return '[Circular]';
			}
			seen.add(value);
		}

		// Remove common problematic objects
		if (value instanceof Error) {
			return {
				name: value.name,
				message: value.message,
				stack: value.stack
			};
		}

		// Handle functions
		if (typeof value === 'function') {
			return '[Function]';
		}

		// Handle undefined
		if (value === undefined) {
			return '[undefined]';
		}

		return value;
	};

	try {
		if (space !== undefined) {
			return JSON.stringify(obj, replacer, space);
		}
		return JSON.stringify(obj, replacer);
	} catch (error) {
		return `[Error stringifying: ${error instanceof Error ? error.message : String(error)}]`;
	}
}

/**
 * Formats a log message with optional metadata
 */
function formatLogMessage(level: LogLevel, message: string, options?: LogOptions): string {
	const timestamp = new Date().toISOString();
	const levelLabel = level.toUpperCase().padEnd(5);

	if (!options || Object.keys(options).length === 0) {
		return `[${timestamp}] ${levelLabel} ${message}`;
	}

	// In dev mode, pretty print the options
	if (isDev) {
		const optionsStr = safeStringify(options, 2);
		return `[${timestamp}] ${levelLabel} ${message}\n${optionsStr}`;
	}

	// In production, keep it compact
	const optionsStr = safeStringify(options);
	return `[${timestamp}] ${levelLabel} ${message} ${optionsStr}`;
}

export const Logger = {
	/**
	 * Logs API request/response information
	 */
	apiCall(
		path: string,
		type: 'query' | 'mutation',
		status: 'success' | 'error',
		duration: number,
		options?: LogOptions
	): void {
		const emoji = status === 'success' ? '✓' : '✗';
		const statusLabel = status === 'success' ? 'SUCCESS' : 'ERROR';
		const typeLabel = type.toUpperCase();

		const message = `${emoji} [${typeLabel}] ${path} - ${statusLabel} (${duration}ms)`;

		const logOptions: LogOptions = {
			path,
			type,
			status,
			duration: `${duration}ms`,
			...(options || {})
		};

		// Only log errors to console.error, others to console.log
		if (status === 'error') {
			console.error(formatLogMessage('error', message, logOptions));
		} else {
			console.log(formatLogMessage('info', message, logOptions));
		}
	},

	/**
	 * Logs database operations
	 */
	dbOperation(operation: string, collection: string, metadata?: LogOptions): void {
		const message = `DB ${operation.toUpperCase()} ${collection}`;
		console.log(formatLogMessage('info', message, metadata));
	},

	/**
	 * General info logging
	 */
	info(message: string, options?: LogOptions): void {
		console.log(formatLogMessage('info', message, options));
	},

	/**
	 * Warning logging
	 */
	warn(message: string, options?: LogOptions): void {
		console.warn(formatLogMessage('warn', message, options));
	},

	/**
	 * Error logging
	 */
	error(message: string, options?: LogOptions): void {
		console.error(formatLogMessage('error', message, options));
	}
};

