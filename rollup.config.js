import { awesomeTypescript } from "rollup-plugin-awesome-typescript";
import { terser } from "rollup-plugin-terser";
import { join } from "path";

const config = require(join(process.cwd(), "package.json"));

const banner = `
/** 
 * @copyright
 * ${config.name} v${config.version}
 * ${config.homepage}
 * 
 * Copyright (c) 2022-present Yanis Morgenegg
 * Released under the MIT license
 */
`;

export default {
  input: "index.ts",
  output: [
    {
      file: "lib/index.cjs",
      format: "cjs",
      banner
    },
    {
      file: "lib/index.mjs",
      format: "esm",
      banner
    },
    {
      file: "lib/index.js",
      name: "announcement",
      format: "umd",
      banner
    },
    {
      file: "lib/index.min.js",
      name: "announcement",
      format: "umd",
      banner,
      plugins: [terser()]
    }
  ],
  plugins: [
    awesomeTypescript({
      declarations: "lib",
      compilerOptions: { target: "ES6", module: "ESNext" }
    })
  ]
};
