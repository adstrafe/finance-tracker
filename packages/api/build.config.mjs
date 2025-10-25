import { Target } from "build-logic/targets";


Target.Library.build(target => {
	target.entry("index", "./src/index.ts");
});
