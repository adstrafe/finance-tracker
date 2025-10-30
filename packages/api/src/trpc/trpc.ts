import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError, treeifyError } from 'zod';
import type { Context } from './context';
import { Logger } from '~/logger';
import { AppError, ErrorCode } from '~/errors';

export const t = initTRPC.context<Context>().create({
	errorFormatter(opts) {
		const { shape, error, path } = opts;

		// Log validation errors (check for ZodError regardless of error code)
		if (error.cause instanceof ZodError) {
			const validationErrors = error.cause.issues.map((err) => ({
				path: err.path.join('.'),
				message: err.message,
				code: err.code
			}));

			Logger.warn('Validation error', {
				procedure: path,
				errorCode: error.code,
				validationErrors
			});
		}

		return {
			...shape,
			data: {
				...shape.data,
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
				errors:
					error.cause instanceof ZodError
						? treeifyError(error.cause)
						: null
			},
		};
	},
});

// Logging middleware - defined here to avoid circular dependency
const loggingMiddleware = t.middleware(async ({ next, path, ctx, input }) => {
	const userId = ctx.user?._id;
	const apiContext = Logger.apiCallStart(path, userId, input);

	try {
		const result = await next();

		Logger.apiCallEnd(apiContext, true, result);
		return result;
	} catch (error) {
		// Convert TRPCError to AppError for consistent logging
		let appError: AppError;

		if (error instanceof TRPCError) {
			// Check if this is a validation error (ZodError in cause)
			if (error.cause instanceof ZodError) {
				const validationErrors = error.cause.issues.map((err) => ({
					path: err.path.join('.'),
					message: err.message,
					code: err.code
				}));

				Logger.warn('Validation error in API call', {
					procedure: path,
					userId,
					errorCode: error.code,
					validationErrors,
					inputKeys: input ? Object.keys(input) : []
				});

				appError = new AppError(
					'Validation error',
					ErrorCode.VALIDATION_ERROR,
					{
						procedure: path,
						userId,
						trpcCode: error.code,
						validationErrors
					},
					true
				);
			} else {
				// Other TRPC errors
				Logger.warn(`TRPC error in API call: ${error.message}`, {
					procedure: path,
					userId,
					errorCode: error.code,
					message: error.message
				});

				appError = new AppError(
					error.message,
					error.code as any,
					{ procedure: path, userId, trpcCode: error.code },
					true
				);
			}
		} else {
			appError = Logger.logError(error, { procedure: path, userId });
		}

		Logger.apiCallEnd(apiContext, false, undefined, appError);

		// Re-throw the original error to maintain tRPC error handling
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
			Logger.warn('Unauthorized access attempt to protected endpoint', {
				procedure: path,
				authenticated: false,
				reason: 'No user in context'
			});
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'You must be logged in to access this resource',
			});
		}

		Logger.debug('Protected endpoint access granted', {
			procedure: path,
			userId: ctx.user._id,
			authenticated: true
		});

		return next({
			ctx: {
				...ctx,
				user: ctx.user
			}
		});
	});
