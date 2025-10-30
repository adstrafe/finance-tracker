import { TRPCError } from '@trpc/server';
import { Logger } from '~/logger';
import { AppError } from '~/errors';

export const loggingMiddleware = async ({ next, path, type, ctx, input }: any) => {
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
};
