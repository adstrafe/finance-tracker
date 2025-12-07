import { Target } from "build-logic/targets";
import { Plugin } from "build-logic/plugins";

Target.WebApplication.build(target => {
	target.entry("index", "./src/index.tsx");

	target.pipelines.code.plugin(Plugin.Delete);
	target.pipelines.code.plugin(Plugin.Copy.configure(cfg => ({
		...cfg,
		targets: [
			{ src: "src/index.html", dest: "./dist" }
		]
	})));
});
