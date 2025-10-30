import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import type { AppConfig } from '~/config/config';
import { Logger } from '~/logger';
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
		const authHeader = req.headers.authorization;

		// No authorization header provided
		if (!authHeader) {
			Logger.debug('No authorization header provided', {
				operation: 'create-context',
				authenticated: false
			});
			return { user: undefined };
		}

		const token = authHeader.replace('Bearer ', '').trim();

		// Empty token provided
		if (!token) {
			Logger.warn('Empty authorization token provided', {
				operation: 'create-context',
				authenticated: false
			});
			return { user: undefined };
		}

		let user: UserContext | undefined;

		try {
			const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;

			// Validate required JWT fields
			if (!decoded.userId || !decoded.email) {
				Logger.warn('JWT token missing required fields', {
					hasUserId: !!decoded.userId,
					hasEmail: !!decoded.email,
					operation: 'create-context',
					authenticated: false
				});
				return { user: undefined };
			}

			user = { _id: decoded.userId, email: decoded.email };
			Logger.auth('User authenticated via JWT', decoded.userId, {
				email: decoded.email,
				authenticated: true
			});
		} catch (error) {
			// Different error messages based on JWT error type
			if (error instanceof jwt.TokenExpiredError) {
				Logger.warn('JWT token expired', {
					expiredAt: error.expiredAt,
					operation: 'create-context',
					authenticated: false
				});
			} else if (error instanceof jwt.JsonWebTokenError) {
				Logger.warn('Invalid JWT token', {
					message: error.message,
					operation: 'create-context',
					authenticated: false
				});
			} else if (error instanceof jwt.NotBeforeError) {
				Logger.warn('JWT token not yet valid', {
					notBefore: error.date,
					operation: 'create-context',
					authenticated: false
				});
			} else {
				Logger.error('Unexpected error verifying JWT', {
					error: error instanceof Error ? error.message : String(error),
					operation: 'create-context',
					authenticated: false
				});
			}
		}

		return { user };
	};
};
