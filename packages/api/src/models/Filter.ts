import { z } from 'zod';
import { PaginationModel } from './Pagination';
import { TransactionType } from './Transaction';

export const FilterModel = z.object({
	_id: z.string(),
	pagination: PaginationModel,
	type: TransactionType.optional(),
	category: z.array(z.string()).optional(),
	createdAt: z.date().optional()
});

export type Filter = z.infer<typeof FilterModel>;
