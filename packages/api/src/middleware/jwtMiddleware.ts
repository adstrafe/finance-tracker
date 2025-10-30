import jwt from 'jsonwebtoken';
import { t } from '~/trpc/trpc';

/**
 * Configured JWT secret - set once at startup
 */
let jwtSecret: string | null = null;

/**
 * Configures the JWT utilities with the secret.
 * Must be called once at application startup.
 */
export const configureJwt = (secret: string): void => {
	if (jwtSecret) {
		throw new Error('JWT already configured');
	}
	jwtSecret = secret;
};

/**
 * Signs a JWT token with the configured secret
 */
export const signJwt = (payload: string | Buffer | object, options: jwt.SignOptions): Promise<string> => {
	if (!jwtSecret) {
		throw new Error('JWT not configured. Call configureJwt() first.');
	}

	const secret = jwtSecret; // Capture for type narrowing

	return new Promise((resolve, reject) => {
		jwt.sign(payload, secret, options, (error, token) => {
			if (error) {
				reject(error);
			} else {
				resolve(token!);
			}
		});
	});
};

/**
 * Middleware that provides JWT utilities to the context.
 * The secret is configured once at startup, never exposed to handlers.
 */
export const jwtMiddleware = t.middleware(({ ctx, next }) => {
	if (!jwtSecret) {
		throw new Error('JWT not configured. Call configureJwt() first.');
	}

	return next({
		ctx: {
			...ctx,
			jwt: {
				sign: signJwt
			}
		}
	});
});

