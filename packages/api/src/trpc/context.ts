import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import type { AppConfig } from '~/config/config';
import jwt from 'jsonwebtoken';

// has to be exported
export interface UserContext {
	readonly _id: string;
	readonly email: string;
};

export interface Context {
	readonly user?: UserContext;
}

/**
 * Factory function that creates a context creator with JWT secret injected.
 * This pattern allows us to configure authentication once at startup.
 *
 * The JWT secret is captured in closure and never exposed to route handlers.
 */
export const createContextFactory = (config: AppConfig) => {
	// Capture only what we need in the closure - JWT secret never leaves this scope
	const jwtSecret = config.auth.jwtSecret;

	return ({ req }: CreateHTTPContextOptions): Context => {
		const token = req.headers.authorization?.replace('Bearer ', '');
		let user: UserContext | undefined;

		if (token) {
			try {
				const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
				user = { _id: decoded.userId, email: decoded.email };
			} catch (error) {
				console.error('Failed creating context: ', { error })
			}
		}

		return { user };
	};
};
