import { z } from 'zod';

export const RegisterInputModel = z.object({
	email: z.email(),
	password: z.string().min(6)
});

export type RegisterModel = z.infer<typeof RegisterInputModel>;

export const LoginInputModel = z.object({
	email: z.email(),
	password: z.string()
});

export type LoginModel = z.infer<typeof LoginInputModel>;

export const AuthOutputModel = z.object({
	token: z.string(),
	user: z.object({
		id: z.string(),
		email: z.string()
	})
});

export type AuthOutput = z.infer<typeof AuthOutputModel>;

export const UserOutputModel = z.object({
	id: z.string(),
	email: z.string()
}).nullable();

export type UserOutput = z.infer<typeof UserOutputModel>;
