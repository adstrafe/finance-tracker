import { ObjectId, OptionalId } from 'mongodb';

export interface User {
	readonly _id: ObjectId;
	readonly email: string;
	readonly passwordHash: string;
	readonly createdAt: Date;
}

export type NewUser = OptionalId<User>;

