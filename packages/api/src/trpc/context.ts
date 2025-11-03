import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import type { AppConfig } from '~/config/config';
import type { Context } from './trpc';
import jwt from 'jsonwebtoken';

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
		const authHeader = req.headers.authorization;

		// No authorization header provided
		if (!authHeader) {
			return { user: undefined };
		}

		const token = authHeader.replace('Bearer ', '').trim();

		// Empty token provided
		if (!token) {
			return { user: undefined };
		}

		try {
			const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;

			// Validate required JWT fields
			if (!decoded.userId || !decoded.email) {
				return { user: undefined };
			}

			return { user: { _id: decoded.userId, email: decoded.email } };
		} catch {
			// Invalid, expired, or malformed token - return unauthenticated context
			return { user: undefined };
		}
	};
};
