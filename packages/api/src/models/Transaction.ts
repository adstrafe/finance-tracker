import { z } from 'zod';

export const TransactionType = z.enum([ 'income', 'expense' ])

export const TransactionInputModel = z.object({
	type: TransactionType,
	amount: z.number(),
	category: z.array(z.string()), // users choice of their own category
	date: z.date(),
	description: z.string().optional()
});


export const TransactionOutputModel = z.object({
	acknowledged: z.boolean(),
	insertedId: z.string().optional()
});


export const TransactionUpdateModel = TransactionInputModel
	.partial()
	.extend({ _id: z.string() });

export type TransactionInput = z.infer<typeof TransactionInputModel>;
export type TransactionOutput = z.infer<typeof TransactionOutputModel>;
