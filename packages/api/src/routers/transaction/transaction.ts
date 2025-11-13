import { createTRPCRouter, protectedProcedure } from '~/trpc/trpc';
import { TransactionInputModel, TransactionOutputModel, TransactionUpdateModel } from '~/models/Transaction';
import { ObjectId } from 'mongodb';
import { mongoMiddleware } from '~/middleware/mongoMiddleware';
import { Collections } from '~/mongo/Collections';
import { TRPCError } from '@trpc/server';
import { Logger } from '~/logger';

import { EntityIdModel } from '~/models/Entity';
import { TransactionFilterModel } from '~/models/Filter';
import { FacetTransactionResult, Transaction } from '~/mongo/schemas/Transaction';

export const transactionRouter = createTRPCRouter({
	addTransaction: protectedProcedure
		.input(TransactionInputModel)
		.output(TransactionOutputModel)
		.use(mongoMiddleware(Collections.transactions))
		.mutation(async ({ ctx: { collection, user }, input: { date, ...rest } }) => {
			Logger.dbOperation('insertOne', 'transactions', {
				userId: user!._id,
				transactionType: rest.type,
				amount: rest.amount
			});

			const transaction = await collection.insertOne({
				...rest,
				createdAt: date,
				updatedAt: date,
				userId: new ObjectId(user!._id)
			} as Transaction);

			return {
				acknowledged: transaction.acknowledged,
				insertedId: transaction.insertedId.toString()
			};
		}),
	updateTransaction: protectedProcedure
		.input(TransactionUpdateModel)
		.output(TransactionOutputModel)
		.use(mongoMiddleware(Collections.transactions))
		.mutation(async ({ ctx: { collection, user }, input: { _id, ...updates } }) => {
			Logger.dbOperation('updateOne', 'transactions', {
				userId: user!._id,
				transactionId: _id,
				updates: Object.keys(updates)
			});

			const transaction = await collection.updateOne(
				{
					_id: new ObjectId(_id),
					userId: new ObjectId(user!._id)
				},
				{
					$set: {
						...updates,
						updatedAt: new Date()
					}
				}
			);

			if (transaction.matchedCount === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Transaction not found'
				});
			}

			return {
				acknowledged: transaction.acknowledged,
				insertedId: _id
			};
		}),
	deleteTransaction: protectedProcedure
		.input(EntityIdModel)
		.output(TransactionOutputModel)
		.use(mongoMiddleware(Collections.transactions))
		.mutation(async ({ ctx: { collection, user }, input: { _id } }) => {
			Logger.dbOperation('deleteOne', 'transactions', {
				userId: user!._id,
				transactionId: _id
			});

			const result = await collection.deleteOne({
				_id: new ObjectId(_id),
				userId: new ObjectId(user!._id)
			});

			if (result.deletedCount === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Transaction not found'
				});
			}

			return {
				acknowledged: result.acknowledged
			};
		}),
	getTransaction: protectedProcedure
		.input(EntityIdModel)
		.use(mongoMiddleware(Collections.transactions))
		.mutation(async ({ ctx: { collection, user }, input: { _id } }) => {
			Logger.dbOperation('findOne', 'transactions', {
				_id,
				userId: user!._id,
				operation: 'get-transaction'
			});

			const result = await collection.findOne({
				_id: new ObjectId(_id),
				userId: new ObjectId(user!._id)
			});

			if (!result) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Transaction not found'
				});
			}

			return result;
		}),
	listTransactions: protectedProcedure
		.input(TransactionFilterModel)
		.use(mongoMiddleware(Collections.transactions))
		.mutation(async ({
			ctx: { collection, user },
			input: {
				pagination: {
					page,
					pageSize
				},
				category,
				createdAt,
				type
			}
		}) => {
		Logger.dbOperation('aggregate', 'transactions', {
			userId: user!._id,
			operation: 'list-transactions',
			filters: { type, category: category, hasCreatedAt: !!createdAt },
			pagination: { page, pageSize }
		});

		const transactions = await collection.aggregate<FacetTransactionResult>([
				{
					$match: {
						userId: new ObjectId(user!._id),
						...(type !== undefined && { type }),
						...(category !== undefined && category.length > 0 && { category }),
						...(createdAt !== undefined && { createdAt })
					}
				},
					{
						$sort: {
							createdAt: 1
						},
					},
					{
						$facet: {
							metadata: [{ $count: 'totalCount' }],
							data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }]
					}
				}
		]).toArray();

		// Handle case where no documents match - $facet returns array with one object
		const result = transactions[0] || { metadata: [], data: [] };
		const { metadata = [], data = [] } = result;

		// $count returns empty array when no documents match
		const totalCount = metadata[0]?.totalCount ?? 0;

		return {
			transactions: data,
			totalCount,
			page,
			pageSize,
			totalPages: Math.ceil(totalCount / pageSize)
		}
		})
})
