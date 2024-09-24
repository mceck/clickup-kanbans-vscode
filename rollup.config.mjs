import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";
import typescript from "@rollup/plugin-typescript";
import { svelteSVG } from "rollup-plugin-svelte-svg";
import path from "path";
import fs from "fs";
import css from "rollup-plugin-css-only";
import autoprefixer from "autoprefixer";
import tailwind from "tailwindcss";

const production = !process.env.ROLLUP_WATCH;

export default fs
  .readdirSync(path.join(".", "web", "pages"))
  .filter((input) => input.endsWith(".ts"))
  .map((input) => {
    const name = input.split(".")[0];
    return {
      input: "web/pages/" + input,
      output: {
        sourcemap: true,
        format: "iife",
        name: "app",
        file: "out/compiled/" + name + ".js",
        assetFileNames: name + ".css",
      },
      plugins: [
        svelte({
          onwarn: (warning, handler) => {
            if (warning.code.startsWith("a11y")) {
              // ignore a11y warnings
              return;
            }
            handler(warning);
          },
          compilerOptions: {
            // enable run-time checks when not in production
            dev: !production,
          },
          preprocess: sveltePreprocess({
            sourceMap: !production,
            postcss: {
              plugins: [tailwind, autoprefixer],
            },
          }),
          emitCss: production,
        }),
        // extract css
        css(),

        // If you have external dependencies installed from
        // npm, you'll most likely need these plugins. In
        // some cases you'll need additional configuration -
        // consult the documentation for details:
        // https://github.com/rollup/plugins/tree/master/packages/commonjs
        resolve({
          browser: true,
          dedupe: ["svelte"],
        }),
        commonjs(),
        typescript({
          tsconfig: "web/tsconfig.json",
          sourceMap: !production,
          inlineSources: !production,
        }),

        // In dev mode, call `npm run start` once
        // the bundle has been generated
        // !production && serve(),

        // Watch the `public` directory and refresh the
        // browser on changes when not in production
        // !production && livereload("public"),

        // If we're building for production (npm run build
        // instead of npm run dev), minify
        production && terser(),

        svelteSVG({
          // optional SVGO options
          // pass empty object to enable defaults
          svgo: {},
        }),
      ],
      watch: {
        clearScreen: false,
      },
    };
  });
