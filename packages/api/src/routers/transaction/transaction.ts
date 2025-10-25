import { createTRPCRouter, protectedProcedure } from '~/trpc/trpc';
import { transactionInputModel, transactionOutputModel, transactionUpdateModel } from '~/models/Transaction';
import { ObjectId } from 'mongodb';
import { TRPCError } from '@trpc/server';
import { mongoContextProvider } from '~/mongo/providers/mongoContextProvider';
import { Collections } from '~/mongo/Collections';

import type { Transaction } from '~/mongo/schemas/Transaction';

export const transactionRouter = createTRPCRouter({
	addTransaction: protectedProcedure
		.input(transactionInputModel)
		.output(transactionOutputModel)
		.use(mongoContextProvider(Collections.transactions))
		.mutation(async ({ ctx: { collection, user }, input: { date, ...rest } }) => {
			try {
				if (!user) {
					throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
				}

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
	updateTransaction: protectedProcedure
		.input(transactionUpdateModel)
		.output(transactionOutputModel)
		.use(mongoContextProvider(Collections.transactions))
		.mutation(async ({ ctx: { collection, user }, input }) => {
			try {
				if (!user) {
					throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
				}

				const { _id, ...updates } = input;

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
					throw new TRPCError({ code: 'NOT_FOUND', message: 'Transaction not found.' });
				}

				return {
					acknowledged: transaction.acknowledged,
					insertedId: _id
				};

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
		})
})
