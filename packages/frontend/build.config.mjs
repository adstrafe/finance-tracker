import { Target } from "build-logic/targets";

Target.WebApplication.build(target => {
	target.entry("index", "./src/index.ts");
});
