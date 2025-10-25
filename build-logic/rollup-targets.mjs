import { declareTarget } from "@calmdownval/rollup-util";

import { Plugin } from "./rollup-plugins.mjs";

export const Target = {
	Library: declareTarget("library", target => (target
		.pipeline("code", pipe => (pipe
			.plugin(Plugin.Externals)
			.plugin(Plugin.NodeResolve)
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
			.plugin(Plugin.NodeResolve)
			.plugin(Plugin.TypeScript)
			.plugin(Plugin.Replace)
			.plugin(Plugin.Terser)
			.output("main")
		))
	)),
};
