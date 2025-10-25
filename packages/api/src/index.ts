import dotenv from 'dotenv';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './router';
import { createContext } from './trpc/context';
import { connectDb } from './utils/db';

dotenv.config();

const HOST = process.env.HOST;
const PORT = process.env.PORT;

const server = createHTTPServer({
	router: appRouter,
	createContext
});

// Connect to MongoDB and start server
const startServer = async () => {
	try {
		await connectDb();
		server.listen(PORT);
		console.log(`🚀 tRPC Server running on http://${HOST}:${PORT}`);
	} catch (error) {
		console.error('❌ Failed to start server:', error);
		process.exit(1);
	}
};

startServer();
