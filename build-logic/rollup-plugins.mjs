import { declarePlugin, inEnv } from "@calmdownval/rollup-util";

export const Plugin = {
	Copy: declarePlugin(
		"copy",
		async () => (await import("rollup-plugin-copy")).default,
	),

	CommonJs: declarePlugin(
		"commonJs",
		async () => (await import("@rollup/plugin-commonjs")).default,
	),

	Css: declarePlugin(
		"css",
		async () => (await import("rollup-plugin-postcss")).default,
	)
		.configure((_, context) => ({
			minimize: context.targetEnv === "prod",
			extract: true,
		})),

	Definitions: declarePlugin(
		"definitions",
		async () => (await import("rollup-plugin-dts")).default,
	),

	Delete: declarePlugin(
		"delete",
		async () => (await import("rollup-plugin-delete")).default,
	)
		.configure(() => ({
			targets: "./dist/**/*",
			runOnce: true,
		})),

	Externals: declarePlugin(
		"externals",
		async () => (await import("rollup-plugin-node-externals")).default,
	),

	ImportFile: declarePlugin(
		"importFile",
		async () => (await import("rollup-plugin-import-file")).default,
	),

	LiveReload: declarePlugin(
		"liveReload",
		async () => (await import("rollup-plugin-livereload")).default,
	)
		.enable((_, context) => context.isWatching)
		.configure(() => ({
			delay: 300,
			verbose: false,
		})),

	NodeResolve: declarePlugin(
		"nodeResolve",
		async () => (await import("@rollup/plugin-node-resolve")).default,
	),

	Replace: declarePlugin(
		"replace",
		async () => (await import("@rollup/plugin-replace")).default,
	)
		.configure((_, context) => ({
			__DEV__: JSON.stringify(context.targetEnv === "dev"),
			preventAssignment: true,
		})),

	Serve: declarePlugin(
		"serve",
		async () => (await import("rollup-plugin-serve")).default,
	)
		.enable((_, context) => context.isWatching)
		.configure(() => ({
			contentBase: "./dist",
			host: "localhost",
			port: 8080,
			open: true,
			verbose: false,
		})),

	Terser: declarePlugin(
		"terser",
		async () => (await import("@rollup/plugin-terser")).default,
	)
		.enable(inEnv("prod"))
		.configure(() => ({
			output: {
				comments: false,
			},
		})),

	TypeScript: declarePlugin(
		"typescript",
		async () => (await import("@rollup/plugin-typescript")).default,
	),
};
