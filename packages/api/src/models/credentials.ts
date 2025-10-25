import { z } from 'zod';

export const registerInputModel = z.object({
	email: z.email(),
	password: z.string().min(6)
});

export type RegisterModel = z.infer<typeof registerInputModel>;

export const loginInputModel = z.object({
	email: z.email(),
	password: z.string()
})

export type LoginModel = z.infer<typeof loginInputModel>;

export const authOutputModel = z.object({
	token: z.string(),
	user: z.object({
		id: z.string(),
		email: z.string()
	})
});

export type AuthOutput = z.infer<typeof authOutputModel>;

export const userOutputModel = z.object({
	id: z.string(),
	email: z.string()
}).nullable();

export type UserOutput = z.infer<typeof userOutputModel>;
