import { createTRPCRouter, protectedProcedure } from '~/trpc/trpc';
import { transactionDeleteModel, transactionInputModel, transactionOutputModel, transactionUpdateModel } from '~/models/Transaction';
import { ObjectId } from 'mongodb';
import { mongoContextProvider } from '~/mongo/providers/mongoContextProvider';
import { Collections } from '~/mongo/Collections';
import { ErrorFactory } from '~/errors';
import { Logger } from '~/logger';

import type { Transaction } from '~/mongo/schemas/Transaction';

export const transactionRouter = createTRPCRouter({
	addTransaction: protectedProcedure
		.input(transactionInputModel)
		.output(transactionOutputModel)
		.use(mongoContextProvider(Collections.transactions))
		.mutation(async ({ ctx: { collection, user }, input: { date, ...rest } }) => {
			if (!user) {
				throw ErrorFactory.authentication('User not found', { procedure: 'addTransaction' });
			}

			Logger.dbOperation('insertOne', 'transactions', {
				userId: user._id,
				transactionType: rest.type,
				amount: rest.amount
			});

			const result = await collection.insertOne({
				...rest,
				createdAt: date,
				updatedAt: date,
				userId: new ObjectId(user._id)
			} as Transaction);

			return {
				acknowledged: result.acknowledged,
				insertedId: result.insertedId.toString()
			};
		}),
	updateTransaction: protectedProcedure
		.input(transactionUpdateModel)
		.output(transactionOutputModel)
		.use(mongoContextProvider(Collections.transactions))
		.mutation(async ({ ctx: { collection, user }, input }) => {
			if (!user) {
				throw ErrorFactory.authentication('User not found', { procedure: 'updateTransaction' });
			}

			const { _id, ...updates } = input;

			Logger.dbOperation('updateOne', 'transactions', {
				userId: user._id,
				transactionId: _id,
				updates: Object.keys(updates)
			});

			const transaction = await collection.updateOne(
				{
					_id: new ObjectId(_id),
					userId: new ObjectId(user._id)
				},
				{
					$set: {
						...updates,
						updatedAt: new Date()
					}
				}
			);

			if (transaction.matchedCount === 0) {
				throw ErrorFactory.notFound('Transaction', {
					procedure: 'updateTransaction',
					userId: user._id,
					transactionId: _id
				});
			}

			return {
				acknowledged: transaction.acknowledged,
				insertedId: _id
			};
		}),
	deleteTransaction: protectedProcedure
		.input(transactionDeleteModel)
		.output(transactionOutputModel)
		.use(mongoContextProvider(Collections.transactions))
		.mutation(async ({ ctx: { collection, user }, input }) => {
			if (!user) {
				throw ErrorFactory.authentication('User not found', { procedure: 'deleteTransaction' });
			}

			Logger.dbOperation('deleteOne', 'transactions', {
				userId: user._id,
				transactionId: input._id
			});

			const result = await collection.deleteOne({
				_id: new ObjectId(input._id),
				userId: new ObjectId(user._id)
			});

			if (result.deletedCount === 0) {
				throw ErrorFactory.notFound('Transaction', {
					procedure: 'deleteTransaction',
					userId: user._id,
					transactionId: input._id
				});
			}

			return {
				acknowledged: result.acknowledged,
				insertedId: input._id
			};
		})
})
