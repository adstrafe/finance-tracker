import dotenv from 'dotenv';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './router';
import { createContextFactory } from './trpc/context';
import { connectDb } from './utils/db';
import { initConfig } from './config/config';
import { configureJwt } from './middleware/jwtMiddleware';
import { configureMongo } from './middleware/mongoMiddleware';

// Load environment variables first
dotenv.config();

// Initialize and validate config at startup (fail-fast if env vars are missing)
const config = initConfig();

// Configure middleware with secrets (config doesn't leave this file)
configureJwt(config.auth.jwtSecret);
configureMongo(config.mongo.dbName);

const server = createHTTPServer({
	router: appRouter,
	createContext: createContextFactory(config)
});

// Connect to MongoDB and start server
const startServer = async () => {
	try {
		await connectDb(config);
		server.listen(config.server.port);
		console.log(`🚀 tRPC Server running on http://${config.server.host}:${config.server.port}`);
	} catch (error) {
		console.error('❌ Failed to start server:', error);
		process.exit(1);
	}
};

startServer();
