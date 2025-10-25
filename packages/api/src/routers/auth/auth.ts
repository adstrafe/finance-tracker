import { TRPCError } from '@trpc/server';
import { authOutputModel, loginInputModel, registerInputModel, userOutputModel } from '~/models/credentials';
import { NewUser, User } from '~/mongo/schemas/User';
import { createTRPCRouter, publicProcedure } from '~/trpc/trpc';
import { sign } from '~/utils/jwt';
import { compare, hash } from 'bcrypt';
import { getEnvVar } from '~/utils/getEnvVar';
import { mongoContextProvider } from '~/mongo/providers/mongoContextProvider';
import { Collections } from '~/mongo/Collections';

const secret = getEnvVar('JWT_SECRET');

export const authRouter = createTRPCRouter({
	register: publicProcedure
		.input(registerInputModel)
		.output(authOutputModel)
		.use(mongoContextProvider(Collections.users))
		.mutation(async ({ ctx: { collection }, input }) => {
			try {
				const { email, password } = input;
				const existingUser = await collection.findOne({ email });
				if (existingUser) {
					throw new TRPCError({ code: 'CONFLICT', message: 'User with this email already exists.' });
				}

				const passwordHash = await hash(password, 10);
				const newUser: NewUser = {
					email,
					passwordHash,
					createdAt: new Date()
				};

				const result = await collection.insertOne(newUser as User);
				const token = await sign({ userId: result.insertedId.toString(), email }, secret, { expiresIn: '1d' }) as string;

				return {
					token,
					user: {
						id: result.insertedId.toString(),
						email
					}
				}
			}
			catch (error) {
				if (error instanceof TRPCError) {
					throw new TRPCError({
						code: error.code,
						message: error.message
					});
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Something went wrong.'
				});
			}
		}),

		login: publicProcedure
			.input(loginInputModel)
			.output(authOutputModel)
			.use(mongoContextProvider(Collections.users))
			.mutation(async ({ ctx: { collection }, input }) => {
				try {
					const { email, password } = input;
					const existingUser = await collection.findOne({ email });
					if (!existingUser) {
						throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password.' });
					}

					const isValidPassword = await compare(password, existingUser.passwordHash);
					if (!isValidPassword) {
						throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password.' });
					}

					const token = await sign({ userId: existingUser._id.toString(), email }, secret, { expiresIn: '1d' }) as string;
					return {
						token,
						user: {
							id: existingUser._id.toString(),
							email
						}
					}
				} catch (error) {
					if (error instanceof TRPCError) {
						throw new TRPCError({
							code: error.code,
							message: error.message
						});
					}

					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'Something went wrong.'
					});
				}
			}),

			me: publicProcedure
				.output(userOutputModel)
				.use(mongoContextProvider(Collections.users))
				.query(async ({ ctx: { collection, user } }) => {
				try {
					if (!user) {
						return null;
					}
					const dbName = getEnvVar('MONGO_DB_NAME');
					const existingUser = await collection.findOne({ email: user.email });
					if (!existingUser) {
						return null;
					}

					return {
						id: existingUser._id.toString(),
						email: existingUser.email
					}
				} catch (error) {
					console.error('Error getting user.', error);
					return null;
				}
			})
});
