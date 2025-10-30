import { authOutputModel, loginInputModel, registerInputModel, userOutputModel } from '~/models/credentials';
import { NewUser, User } from '~/mongo/schemas/User';
import { createTRPCRouter, publicProcedure } from '~/trpc/trpc';
import { sign } from '~/utils/jwt';
import { compare, hash } from 'bcrypt';
import { getEnvVar } from '~/utils/getEnvVar';
import { mongoContextProvider } from '~/mongo/providers/mongoContextProvider';
import { Collections } from '~/mongo/Collections';
import { ErrorFactory, AppError, ErrorCode } from '~/errors';
import { Logger } from '~/logger';

const secret = getEnvVar('JWT_SECRET');

export const authRouter = createTRPCRouter({
	register: publicProcedure
		.input(registerInputModel)
		.output(authOutputModel)
		.use(mongoContextProvider(Collections.users))
		.mutation(async ({ ctx: { collection }, input }) => {
			const { email, password } = input;

			Logger.dbOperation('findOne', 'users', {
				email,
				operation: 'check-existing-user'
			});

			const existingUser = await collection.findOne({ email });
			if (existingUser) {
				throw new AppError('User with this email already exists', ErrorCode.DUPLICATE_ENTRY, {
					procedure: 'register',
					email
				});
			}

			const passwordHash = await hash(password, 10);
			const newUser: NewUser = {
				email,
				passwordHash,
				createdAt: new Date()
			};

			Logger.dbOperation('insertOne', 'users', {
				email,
				operation: 'create-user'
			});

			const result = await collection.insertOne(newUser as User);
			const token = await sign({ userId: result.insertedId.toString(), email }, secret, { expiresIn: '1d' }) as string;

			return {
				token,
				user: {
					id: result.insertedId.toString(),
					email
				}
			}
		}),

	login: publicProcedure
		.input(loginInputModel)
		.output(authOutputModel)
		.use(mongoContextProvider(Collections.users))
		.mutation(async ({ ctx: { collection }, input }) => {
			const { email, password } = input;

			Logger.dbOperation('findOne', 'users', {
				email,
				operation: 'login-attempt'
			});

			const existingUser = await collection.findOne({ email });
			if (!existingUser) {
				throw ErrorFactory.authentication('Invalid email or password', {
					procedure: 'login',
					email
				});
			}

			const isValidPassword = await compare(password, existingUser.passwordHash);
			if (!isValidPassword) {
				throw ErrorFactory.authentication('Invalid email or password', {
					procedure: 'login',
					email
				});
			}

			const token = await sign({ userId: existingUser._id.toString(), email }, secret, { expiresIn: '1d' }) as string;
			return {
				token,
				user: {
					id: existingUser._id.toString(),
					email
				}
			}
		}),

	me: publicProcedure
		.output(userOutputModel)
		.use(mongoContextProvider(Collections.users))
		.query(async ({ ctx: { collection, user } }) => {
			if (!user) {
				return null;
			}

			Logger.dbOperation('findOne', 'users', {
				email: user.email,
				operation: 'get-current-user'
			});

			const existingUser = await collection.findOne({ email: user.email });
			if (!existingUser) {
				return null;
			}

			return {
				id: existingUser._id.toString(),
				email: existingUser.email
			}
		})
});
