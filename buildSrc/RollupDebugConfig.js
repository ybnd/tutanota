import SystemConfig from "./SystemConfig.js"
import {babel} from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"

const path = require("path")

function resolveLibs(baseDir = ".") {
	return {
		name: "resolve-libs",
		resolveId(source) {
			const resolved = SystemConfig.dependencyMap[source]
			return resolved && path.join(baseDir, resolved)
		}
	}
}

function rollupDebugPlugins(baseDir) {
	return [
		babel({
			plugins: [
				// Using Flow plugin and not preset to run before class-properties and avoid generating strange property code
				"@babel/plugin-transform-flow-strip-types",
				"@babel/plugin-proposal-class-properties",
				"@babel/plugin-syntax-dynamic-import"
			]
		}),
		resolveLibs(baseDir),
		commonjs({
			exclude: ["src/**"],
			ignore: ["util"]
		}),
	]
}

export default {
	input: ["src/app.js", "src/api/worker/WorkerImpl.js"],
	plugins: rollupDebugPlugins(""),
	treeshake: false, // disable tree-shaking for faster development builds
	output: {format: "es", sourcemap: "inline", dir: "build"},
}