import { createTRPCRouter, protectedProcedure } from '~/trpc/trpc';
import { TransactionInputModel, TransactionOutputModel, TransactionUpdateModel } from '~/models/Transaction';
import { ObjectId } from 'mongodb';
import { mongoContextProvider } from '~/mongo/providers/mongoContextProvider';
import { Collections } from '~/mongo/Collections';
import { ErrorFactory } from '~/errors';
import { Logger } from '~/logger';

import { FilterModel } from '~/models/Filter';
import { FacetTransactionResult, Transaction } from '~/mongo/schemas/Transaction';

export const transactionRouter = createTRPCRouter({
	addTransaction: protectedProcedure
		.input(TransactionInputModel)
		.output(TransactionOutputModel)
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

			const transaction = await collection.insertOne({
				...rest,
				createdAt: date,
				updatedAt: date,
				userId: new Object(user._id)
			} as Transaction);

			return {
				acknowledged: transaction.acknowledged,
				insertedId: transaction.insertedId.toString()
			};
		}),
	updateTransaction: protectedProcedure
		.input(TransactionUpdateModel)
		.output(TransactionOutputModel)
		.use(mongoContextProvider(Collections.transactions))
		.mutation(async ({ ctx: { collection, user }, input: { _id, ...updates } }) => {
			if (!user) {
				throw ErrorFactory.authentication('User not found', { procedure: 'updateTransaction' });
			}

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
		.input(FilterModel)
		.output(TransactionOutputModel)
		.use(mongoContextProvider(Collections.transactions))
		.mutation(async ({ ctx: { collection, user }, input: { _id } }) => {
			if (!user) {
				throw ErrorFactory.authentication('User not found', { procedure: 'deleteTransaction' });
			}

			Logger.dbOperation('deleteOne', 'transactions', {
				userId: user._id,
				transactionId: _id
			});

			const result = await collection.deleteOne({
				_id: new ObjectId(_id),
				userId: new ObjectId(user._id)
			});

			if (result.deletedCount === 0) {
				throw ErrorFactory.notFound('Transaction', {
					procedure: 'deleteTransaction',
					userId: user._id,
					transactionId: _id
				});
			}

			return {
				acknowledged: result.acknowledged
			};
		}),
	getTransaction: protectedProcedure
		.input(FilterModel)
		.use(mongoContextProvider(Collections.transactions))
		.query(async ({ ctx: { collection, user }, input: { _id } }) => {
			if (!user) {
				throw ErrorFactory.authentication('User not found', { procedure: 'getTransaction' });
			}

			Logger.dbOperation('findOne', 'transactions', {
				_id,
				userId: user._id,
				operation: 'get-transaction'
			});

			const result = await collection.findOne({
				_id: new ObjectId(_id),
				userId: new ObjectId(user._id)
			});

			if (!result) {
				throw ErrorFactory.notFound('Transaction', {
					procedure: 'getTransaction',
					resourceId: _id,
					userId: user._id,
				})
			}

			return result;
		}),
	listTransactions: protectedProcedure
		.input(FilterModel)
		.use(mongoContextProvider(Collections.transactions))
		.query(async ({
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
			if (!user) {
				throw ErrorFactory.authentication('User not found', { procedure: 'listTransaction' });
			}

			const transactions = await collection.aggregate<FacetTransactionResult>([
					{
						$match: {
							userId: user._id,
							category,
							createdAt,
							type
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

			const [{ metadata, data }] = transactions;
			const totalCount = metadata[0].totalCount ?? 0;

			return {
				transactions: data,
				totalCount,
				page,
				pageSize,
				totalPages: Math.ceil(totalCount / pageSize)
			}
		})
})
