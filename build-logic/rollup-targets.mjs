import { declareTarget } from "@calmdownval/rollup-util";

import { Plugin } from "./rollup-plugins.mjs";

export const Target = {
	Library: declareTarget("library", target => (target
		.pipeline("code", pipe => (pipe
			.plugin(Plugin.Externals)
			.plugin(Plugin.TypeScript)
			.plugin(Plugin.Replace)
			.plugin(Plugin.Terser)
			.output("main")
			.configure(config => ({
				...config,
				entryFileNames: "[name].mjs",
			}))
		))
		.pipeline("types", pipe => (pipe
			.plugin(Plugin.TypeScript)
			.plugin(Plugin.Definitions)
			.output("main")
			.configure(config => ({
				...config,
				entryFileNames: "[name].d.ts",
			}))
		))
	)),
	WebApplication: declareTarget("webApplication", target => (target
		.pipeline("code", pipe => (pipe
			.plugin(Plugin.Css)
			.plugin(Plugin.NodeResolve.configure(config => ({
				...config,
				browser: true,
				extensions: [ ".tsx", ".ts", ".jsx", ".js", ".json" ],
			})))
			.plugin(Plugin.ImportFile.configure(config => ({
				...config,
				output: "./dist/assets",
				extensions: /\.(svg|web[pma]|wasm)$/,
			})))
			.plugin(Plugin.CommonJs)
			.plugin(Plugin.TypeScript)
			.plugin(Plugin.Replace)
			.plugin(Plugin.Terser)
			.plugin(Plugin.LiveReload)
			.plugin(Plugin.Serve)
			.suppress("CIRCULAR_DEPENDENCY")
			.output("main")
			.configure(config => ({
				...config,
				format: "iife",
				entryFileNames: "[name].js",
			}))
		))
	)),
};
