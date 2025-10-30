// ANSI color codes for terminal output
export const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
	gray: '\x1b[90m',

	// Background colors
	bgRed: '\x1b[41m',
	bgGreen: '\x1b[42m',
	bgYellow: '\x1b[43m',
	bgBlue: '\x1b[44m',
	bgMagenta: '\x1b[45m',
	bgCyan: '\x1b[46m',
} as const;

// Emojis for different log levels and operations
export const emojis = {
	// Log levels
	error: '❌',
	warn: '⚠️',
	info: 'ℹ️',
	debug: '🐛',

	// API operations
	apiStart: '🚀',
	apiSuccess: '✅',
	apiError: '💥',

	// Database operations
	db: '🗄️',
	dbInsert: '➕',
	dbUpdate: '✏️',
	dbDelete: '🗑️',
	dbQuery: '🔍',

	// Authentication
	auth: '🔐',
	login: '🔑',
	logout: '🚪',

	// General
	success: '✨',
	loading: '⏳',
	done: '🎉',
	arrow: '→',
	bullet: '•',
	pipe: '│',
	corner: '└',
	branch: '├',
} as const;

// Console styling utilities
export class ConsoleStyles {
	static colorize(text: string, color: keyof typeof colors): string {
		return `${colors[color]}${text}${colors.reset}`;
	}

	static bold(text: string): string {
		return `${colors.bright}${text}${colors.reset}`;
	}

	static dim(text: string): string {
		return `${colors.dim}${text}${colors.reset}`;
	}

	static highlight(text: string): string {
		return `${colors.bgBlue}${colors.white}${text}${colors.reset}`;
	}

	static success(text: string): string {
		return `${colors.green}${text}${colors.reset}`;
	}

	static error(text: string): string {
		return `${colors.red}${text}${colors.reset}`;
	}

	static warning(text: string): string {
		return `${colors.yellow}${text}${colors.reset}`;
	}

	static info(text: string): string {
		return `${colors.cyan}${text}${colors.reset}`;
	}

	static debug(text: string): string {
		return `${colors.gray}${text}${colors.reset}`;
	}

	static procedure(text: string): string {
		return `${colors.magenta}${colors.bright}${text}${colors.reset}`;
	}

	static userId(text: string): string {
		return `${colors.blue}${text}${colors.reset}`;
	}

	static duration(text: string): string {
		return `${colors.green}${colors.bright}${text}${colors.reset}`;
	}

	static context(text: string): string {
		return `${colors.gray}${text}${colors.reset}`;
	}

	// Format timestamp
	static timestamp(date: Date): string {
		const time = date.toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			fractionalSecondDigits: 3
		});
		return `${colors.dim}[${time}]${colors.reset}`;
	}

	// Format API call start
	static apiCallStart(procedure: string, userId?: string): string {
		const timestamp = ConsoleStyles.timestamp(new Date());
		const proc = ConsoleStyles.procedure(procedure);
		const user = userId ? ` ${ConsoleStyles.userId(`@${userId}`)}` : '';
		const emoji = emojis.apiStart;

		return `${timestamp} ${emoji} ${ConsoleStyles.bold('API Call')} ${proc}${user}`;
	}

	// Format API call end
	static apiCallEnd(procedure: string, success: boolean, duration: number, userId?: string): string {
		const timestamp = ConsoleStyles.timestamp(new Date());
		const proc = ConsoleStyles.procedure(procedure);
		const user = userId ? ` ${ConsoleStyles.userId(`@${userId}`)}` : '';
		const dur = ConsoleStyles.duration(`${duration}ms`);

		if (success) {
			const emoji = emojis.apiSuccess;
			return `${timestamp} ${emoji} ${ConsoleStyles.success('Completed')} ${proc}${user} ${ConsoleStyles.dim('in')} ${dur}`;
		} else {
			const emoji = emojis.apiError;
			return `${timestamp} ${emoji} ${ConsoleStyles.error('Failed')} ${proc}${user} ${ConsoleStyles.dim('in')} ${dur}`;
		}
	}

	// Format log entry
	static logEntry(level: string, message: string, emoji: string, context?: any): string {
		const timestamp = ConsoleStyles.timestamp(new Date());

		// Map log levels to colors
		const levelColorMap: Record<string, keyof typeof colors> = {
			'ERROR': 'red',
			'WARN': 'yellow',
			'INFO': 'cyan',
			'DEBUG': 'gray'
		};

		const levelColor = levelColorMap[level] || 'white';
		const levelText = ConsoleStyles.colorize(level, levelColor);
		const msg = ConsoleStyles.bold(message);

		let output = `${timestamp} ${emoji} ${levelText} ${msg}`;

		if (context && Object.keys(context).length > 0) {
			const contextStr = JSON.stringify(context, null, 2);
			output += `\n${ConsoleStyles.context('Context:')}\n${ConsoleStyles.context(contextStr)}`;
		}

		return output;
	}

	// Format error details
	static errorDetails(error: any, context?: any): string {
		let output = '';

		if (error.message) {
			output += `${ConsoleStyles.error('Error:')} ${error.message}\n`;
		}

		if (error.code) {
			output += `${ConsoleStyles.warning('Code:')} ${error.code}\n`;
		}

		if (error.stack && process.env.NODE_ENV === 'development') {
			output += `${ConsoleStyles.debug('Stack:')}\n${ConsoleStyles.debug(error.stack)}`;
		}

		if (context && Object.keys(context).length > 0) {
			const contextStr = JSON.stringify(context, null, 2);
			output += `\n${ConsoleStyles.context('Context:')}\n${ConsoleStyles.context(contextStr)}`;
		}

		return output;
	}

	// Format database operation
	static dbOperation(operation: string, collection: string, context?: any): string {
		const timestamp = ConsoleStyles.timestamp(new Date());
		const op = ConsoleStyles.bold(operation);
		const coll = ConsoleStyles.procedure(collection);
		const emoji = emojis.db;

		let output = `${timestamp} ${emoji} ${ConsoleStyles.info('DB')} ${op} ${ConsoleStyles.dim('on')} ${coll}`;

		if (context && Object.keys(context).length > 0) {
			const contextStr = JSON.stringify(context, null, 2);
			output += `\n${ConsoleStyles.context('Context:')}\n${ConsoleStyles.context(contextStr)}`;
		}

		return output;
	}
}
