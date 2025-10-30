import { AuthOutputModel, LoginInputModel, RegisterInputModel, UserOutputModel } from '~/models/Auth';
import { NewUser, User } from '~/mongo/schemas/User';
import { createTRPCRouter, publicProcedure } from '~/trpc/trpc';
import { jwtMiddleware } from '~/middleware/jwtMiddleware';
import { compare, hash } from 'bcrypt';
import { mongoMiddleware } from '~/middleware/mongoMiddleware';
import { Collections } from '~/mongo/Collections';
import { ErrorFactory, AppError, ErrorCode } from '~/errors';
import { Logger } from '~/logger';

export const authRouter = createTRPCRouter({
	register: publicProcedure
		.input(RegisterInputModel)
		.output(AuthOutputModel)
		.use(mongoMiddleware(Collections.users))
		.use(jwtMiddleware)
		.mutation(async ({ ctx: { collection, jwt }, input }) => {
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
		const token = await jwt.sign({ userId: result.insertedId.toString(), email }, { expiresIn: '1d' });

		return {
			token,
			user: {
				id: result.insertedId.toString(),
				email
			}
		}
		}),

	login: publicProcedure
		.input(LoginInputModel)
		.output(AuthOutputModel)
		.use(mongoMiddleware(Collections.users))
		.use(jwtMiddleware)
		.mutation(async ({ ctx: { collection, jwt }, input }) => {
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

			const token = await jwt.sign({ userId: existingUser._id.toString(), email }, { expiresIn: '1d' });
			return {
				token,
				user: {
					id: existingUser._id.toString(),
					email
				}
			}
		}),

	me: publicProcedure
		.output(UserOutputModel)
		.query(async ({ ctx: { user } }) => {
			if (!user) {
				return null;
			}

			return {
				id: user._id,
				email: user.email
			}
		})
});
