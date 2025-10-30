import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError, treeifyError } from 'zod';
import type { Context } from './context';
import { loggingMiddleware } from '../middleware/loggingMiddleware';

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
