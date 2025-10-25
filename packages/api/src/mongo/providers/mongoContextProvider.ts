import { t } from '~/trpc/trpc';
import { Collections, CollectionsMap } from '../Collections';
import { getEnvVar } from '~/utils/getEnvVar';
import { getCollection } from '~/utils/db';

export const mongoContextProvider = <C extends Collections>(collectionName: C) => {
	return t.middleware(({ ctx, next }) => {
		const dbName = getEnvVar('MONGO_DB_NAME');
		const collection = getCollection<CollectionsMap[C]>(collectionName, dbName);

		return next({ ctx: {
			...ctx,
			collection
		}});
	});
}
