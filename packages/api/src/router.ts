import { createTRPCRouter } from './trpc/trpc';
import { authRouter } from './routers/auth/auth';
import { transactionRouter } from './routers/transaction/transaction';

export const appRouter = createTRPCRouter({
	auth: authRouter,
	transaction: transactionRouter
});

export type AppRouter = typeof appRouter;
