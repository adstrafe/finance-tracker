import { z } from 'zod';

export const transactionInputModel = z.object({
	type: z.enum([ 'income', 'expense' ]),
	amount: z.number(),
	category: z.array(z.string()), // users choice of their own category
	date: z.date(),
	description: z.string().optional()
});


export const transactionOutputModel = z.object({
	acknowledged: z.boolean(),
	insertedId: z.string()
});


export const transactionUpdateModel = transactionInputModel
.partial()
.extend({ _id: z.string() });

export const transactionDeleteModel = transactionUpdateModel.pick({ _id: true });

export type TransactionInput = z.infer<typeof transactionInputModel>;
export type TransactionOutput = z.infer<typeof transactionOutputModel>;
export type TransactionDelete = z.infer<typeof transactionDeleteModel>;
