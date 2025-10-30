import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError, treeifyError } from 'zod';
import type { Context } from './context';
import { Logger } from '~/logger';
import { AppError } from '~/errors';

export const t = initTRPC.context<Context>().create({
	errorFormatter(opts) {
		const { shape, error } = opts;
		return {
			...shape,
			data: {
				...shape.data,
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
				errors:
					error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
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
			appError = new AppError(
				error.message,
				error.code as any, // Map TRPC error codes to our ErrorCode enum
				{ procedure: path, userId, trpcCode: error.code },
				true
			);
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
	.use(({ ctx, next }) => {
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
