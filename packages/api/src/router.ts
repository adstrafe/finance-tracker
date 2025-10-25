import { createTRPCRouter } from './trpc/trpc';
import { authRouter } from './routers/auth/auth';

export const appRouter = createTRPCRouter({
	auth: authRouter
});

export type AppRouter = typeof appRouter;
