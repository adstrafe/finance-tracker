import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError, treeifyError } from 'zod';
import { Logger } from '~/logger';
import { getEnvVar } from '~/utils/getEnvVar';

// Context types
export interface UserContext {
	readonly _id: string;
	readonly email: string;
}

export interface Context {
	readonly user?: UserContext;
}

const isDev = getEnvVar('NODE_ENV') === 'development' ? true : false;

export const t = initTRPC.context<Context>().create({
	errorFormatter(opts) {
		const { shape, error } = opts;

		// Check if error is an AppError (custom error with code property)
		const appError = error.cause && typeof error.cause === 'object' && 'code' in error.cause
			? error.cause as { code?: unknown }
			: null;

		return {
			...shape,
			message: error.message,
			data: {
				...shape.data,
				code: appError?.code || error.code,
				httpStatus: shape.data.httpStatus,
				stack: isDev ? error.stack : undefined,
				errors:
					error.cause instanceof ZodError
						? treeifyError(error.cause)
						: null
			},
		};
	},
});

/**
 * Middleware that logs all tRPC procedure calls with:
 * - Path and type (query/mutation)
 * - Success/error status
 * - Duration
 * - Input payload (in dev mode)
 * - Error details (if any)
 */
const loggingMiddleware = t.middleware(async ({ path, type, ctx, next, input }) => {
	const startTime = Date.now();

	// Log request details in dev mode
	if (isDev && input && Object.keys(input).length > 0) {
		Logger.info(`→ [${type.toUpperCase()}] ${path}`, {
			input: input
		});
	}

	try {
		const result = await next();

		const duration = Date.now() - startTime;

		// Check if result indicates an error
		const resultObj = result && typeof result === 'object' ? result as unknown as Record<string, unknown> : null;
		const hasError = resultObj && ('error' in resultObj || (resultObj.ok === false));
		const status: 'success' | 'error' = hasError ? 'error' : 'success';

		// Log response
		const logOptions: Record<string, unknown> = {};
		if (isDev && type === 'mutation' && result) {
			if (hasError && resultObj) {
				// Extract and format error information
				const error = resultObj.error;
				if (error && typeof error === 'object') {
					const errorObj = error as Record<string, unknown>;
					const formattedError: Record<string, unknown> = {
						message: errorObj.message || 'Unknown error',
					};

					// Try to parse and format validation errors
					if (typeof errorObj.message === 'string') {
						try {
							const parsed = JSON.parse(errorObj.message);
							if (Array.isArray(parsed)) {
								// Format Zod validation errors nicely
								formattedError.validationErrors = parsed.map((err: { path?: unknown[]; message?: string }) => ({
									path: err.path?.join('.') || 'unknown',
									message: err.message || 'Validation failed'
								}));
								formattedError.message = 'Validation failed';
							}
						} catch {
							// Not JSON, use as is
						}
					}

					if ('name' in errorObj) formattedError.name = errorObj.name;
					if ('code' in errorObj) formattedError.code = errorObj.code;

					logOptions.error = formattedError;
				} else {
					logOptions.error = error;
				}
			} else if (result && typeof result === 'object') {
				// Extract only the data field from successful tRPC response, exclude ctx and other internal fields
				if ('data' in result) {
					logOptions.output = (result as { data?: unknown }).data;
				} else {
					// Exclude internal tRPC fields like ctx, ok, marker, etc.
					const { ctx, ok, marker, ...cleanResult } = resultObj!;
					logOptions.output = cleanResult;
				}
			} else {
				logOptions.output = result;
			}
		}

		Logger.apiCall(path, type as 'query' | 'mutation', status, duration, logOptions);

		return result;
	} catch (error) {
		const duration = Date.now() - startTime;
		const status: 'success' | 'error' = 'error';

		// Extract and format error information
		const errorInfo: Record<string, unknown> = {};

		if (error instanceof Error) {
			let message = error.message;

			// Try to parse and format validation errors (Zod errors often have JSON strings as messages)
			if (typeof message === 'string') {
				try {
					const parsed = JSON.parse(message);
					if (Array.isArray(parsed)) {
						// Format Zod validation errors nicely
						errorInfo.validationErrors = parsed.map((err: { path?: unknown[]; message?: string; code?: string }) => ({
							path: err.path?.join('.') || 'unknown',
							message: err.message || 'Validation failed',
							code: err.code || 'invalid_type'
						}));
						errorInfo.message = 'Validation failed';
					} else {
						errorInfo.message = message;
					}
				} catch {
					// Not JSON, use as is
					errorInfo.message = message;
				}
			} else {
				errorInfo.message = message;
			}

			errorInfo.name = error.name;

			// Include additional error data if available
			if ('code' in error) {
				errorInfo.code = (error as { code?: unknown }).code;
			}

			if ('cause' in error && error.cause) {
				errorInfo.cause = error.cause instanceof Error ? error.cause.message : error.cause;
			}
		} else {
			errorInfo.message = String(error);
		}

		// Log error response
		Logger.apiCall(path, type as 'query' | 'mutation', status, duration, {
			error: errorInfo,
			// Include input in error logs for debugging
			...(isDev && input ? { input: input } : {})
		});

		// Re-throw the error so tRPC can handle it
		throw error;
	}
});

// Base router and procedure
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure.use(loggingMiddleware);

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure
	.use(loggingMiddleware)
	.use(({ ctx, next, path }) => {
		if (!ctx.user) {
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'You must be logged in to access this resource',
			});
		}

		return next({
			ctx: {
				...ctx,
				user: ctx.user
			}
		});
	});
