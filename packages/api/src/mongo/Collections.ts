import { Transaction } from './schemas/Transaction';
import { User } from './schemas/User';

export enum Collections {
	users = 'users',
	transactions = 'transactions'
}

export type CollectionsMap = {
	[Collections.users]: User,
	[Collections.transactions]: Transaction
};
