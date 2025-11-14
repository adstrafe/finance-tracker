import { build } from "@calmdownval/rollup-util";

await build(undefined, [ ...process.argv.slice(2), "--watch" ]);
