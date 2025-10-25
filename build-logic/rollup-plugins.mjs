import { declarePlugin, inEnv } from "@calmdownval/rollup-util";

export const Plugin = {
	Copy: declarePlugin(
		"copy",
		async () => (await import("rollup-plugin-copy")).default,
	),

	Css: declarePlugin(
		"css",
		async () => (await import("rollup-plugin-import-css")).default,
	)
		.configure((_, context) => ({
			minify: context.targetEnv === "prod",
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
			targets: "./build",
			runOnce: true,
		})),

	Externals: declarePlugin(
		"externals",
		async () => (await import("rollup-plugin-node-externals")).default,
	),

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
