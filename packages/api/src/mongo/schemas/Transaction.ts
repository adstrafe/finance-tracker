import { ObjectId } from 'mongodb';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
	readonly _id: ObjectId,
	readonly userId: ObjectId,
	readonly type: TransactionType,
	readonly amount: number,
	readonly category: string[], // users choice of their own category
	readonly createdAt: Date,
	readonly updatedAt: Date
	readonly description?: string;
}
