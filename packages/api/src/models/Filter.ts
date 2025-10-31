import { z } from 'zod';
import { PaginationModel } from './Pagination';
import { TransactionType } from './Transaction';

/**
 * Model for filtering and listing transactions with pagination and optional filters
 */
export const TransactionFilterModel = z.object({
	pagination: PaginationModel,
	type: TransactionType.optional(),
	category: z.array(z.string()).optional(),
	createdAt: z.coerce.date().optional() // Automatically converts ISO string to Date
});

export type TransactionFilter = z.infer<typeof TransactionFilterModel>;
