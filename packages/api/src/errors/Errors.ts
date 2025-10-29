export enum ErrorCode {
	// Authentication & Authorization
	UNAUTHORIZED = 'UNAUTHORIZED',
	FORBIDDEN = 'FORBIDDEN',
	TOKEN_EXPIRED = 'TOKEN_EXPIRED',
	INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

	// Validation
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	INVALID_INPUT = 'INVALID_INPUT',
	MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

	// Not Found
	NOT_FOUND = 'NOT_FOUND',
	USER_NOT_FOUND = 'USER_NOT_FOUND',
	TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',

	// Database
	DATABASE_ERROR = 'DATABASE_ERROR',
	CONNECTION_ERROR = 'CONNECTION_ERROR',
	QUERY_ERROR = 'QUERY_ERROR',

	// Business Logic
	INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
	DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
	OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

	// System
	INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
	EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
	RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
	MAINTENANCE_MODE = 'MAINTENANCE_MODE'
}

export interface ErrorContext {
	userId?: string;
	procedure?: string;
	operation?: string;
	resourceId?: string;
	[key: string]: any;
}

export class AppError extends Error {
	public readonly code: ErrorCode;
	public readonly context: ErrorContext;
	public readonly timestamp: Date;
	public readonly isOperational: boolean;

	constructor(
		message: string,
		code: ErrorCode,
		context: ErrorContext = {},
		isOperational: boolean = true
	) {
		super(message);
		this.name = 'AppError';
		this.code = code;
		this.context = context;
		this.timestamp = new Date();
		this.isOperational = isOperational;

		// Ensure proper prototype chain
		Object.setPrototypeOf(this, AppError.prototype);
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			context: this.context,
			timestamp: this.timestamp.toISOString(),
			isOperational: this.isOperational,
			stack: this.stack
		};
	}
}

// Specific error classes for different scenarios
export class ValidationError extends AppError {
	constructor(message: string, context: ErrorContext = {}) {
		super(message, ErrorCode.VALIDATION_ERROR, context);
		this.name = 'ValidationError';
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string, context: ErrorContext = {}) {
		super(`${resource} not found`, ErrorCode.NOT_FOUND, context);
		this.name = 'NotFoundError';
	}
}

export class DatabaseError extends AppError {
	constructor(message: string, context: ErrorContext = {}) {
		super(message, ErrorCode.DATABASE_ERROR, context);
		this.name = 'DatabaseError';
	}
}

export class AuthenticationError extends AppError {
	constructor(message: string, context: ErrorContext = {}) {
		super(message, ErrorCode.UNAUTHORIZED, context);
		this.name = 'AuthenticationError';
	}
}

export class AuthorizationError extends AppError {
	constructor(message: string, context: ErrorContext = {}) {
		super(message, ErrorCode.FORBIDDEN, context);
		this.name = 'AuthorizationError';
	}
}

// Error factory for creating errors with consistent structure
export class ErrorFactory {
	static validation(message: string, context: ErrorContext = {}): ValidationError {
		return new ValidationError(message, context);
	}

	static notFound(resource: string, context: ErrorContext = {}): NotFoundError {
		return new NotFoundError(resource, context);
	}

	static database(message: string, context: ErrorContext = {}): DatabaseError {
		return new DatabaseError(message, context);
	}

	static authentication(message: string, context: ErrorContext = {}): AuthenticationError {
		return new AuthenticationError(message, context);
	}

	static authorization(message: string, context: ErrorContext = {}): AuthorizationError {
		return new AuthorizationError(message, context);
	}

	static internal(message: string, context: ErrorContext = {}): AppError {
		return new AppError(message, ErrorCode.INTERNAL_SERVER_ERROR, context, false);
	}
}
