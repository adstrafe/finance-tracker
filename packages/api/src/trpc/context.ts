import { getEnvVar } from '~/utils/getEnvVar';
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';

import jwt from 'jsonwebtoken';

// has to be exported
export interface UserContext {
	readonly _id: string;
	readonly email: string;
};

export interface Context {
	readonly user?: UserContext;
}

export const createContext = ({ req }: CreateHTTPContextOptions): Context => {
	const token = req.headers.authorization?.replace('Bearer ', '');
	let user: UserContext | undefined;

	if (token) {
		try {
			const secret = getEnvVar('JWT_SECRET')
			const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
			user = { _id: decoded.userId, email: decoded.email };
		} catch (error) {
			console.error('Failed creating context: ', { error })
		}
	}

	return { user };
};
