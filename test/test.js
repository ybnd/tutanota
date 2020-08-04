import Promise from "bluebird"
import path from "path"
import child_process from "child_process"
import * as env from "../buildSrc/env.js"
import {renderHtml} from "../buildSrc/LaunchHtml.js"
import rollup from "rollup"
import flow from "flow-bin"
import {rollupDebugPlugins} from "../buildSrc/RollupConfig.js"
import fs from "fs-extra"

let project
if (process.argv.indexOf("api") !== -1) {
	project = "api"
} else if (process.argv.indexOf("client") !== -1) {
	project = "client"
} else {
	console.error("must provide 'api' or 'client' to run the tests")
	process.exit(1)
}

let testRunner = null

/** Returns cache or null. */
function readCache(cacheLocation) {
	try {
		// *must not* return boolean. Returning "false" will disable caching which is bad.
		return fs.existsSync(cacheLocation) ? JSON.parse(fs.readFileSync(cacheLocation, {encoding: "utf8"})) : null
	} catch (e) {
		return null
	}
}

// We use this homebrew plugin so that libs are copies to _virtual folder and *not* build/node_modules
// (which would be the case with preserve_modules).
// Files in build/node_modules are treated as separate libraries and ES mode resets back to commonjs.
function resolveTestLibsPlugin() {
	const testLibs = {
		ospec: "../node_modules/ospec/ospec.js"
	}

	return {
		name: "resolve-test-libs",
		resolveId(source) {
			return testLibs[source]
		}
	}
}

async function copyLibs() {
	return fs.copy('../libs', '../build/libs')
}

async function build() {
	const cacheLocation = "../build/test-cache"
	const cache = readCache(cacheLocation)
	const bundle = await rollup.rollup({
		input: [`${project}/Suite.js`],
		plugins: rollupDebugPlugins("..").concat(resolveTestLibsPlugin()),
		treeshake: false,
		preserveModules: true,
		cache
	})

	return Promise.all([
		fs.copy(`${project}/bootstrapNode.js`, `../build/test/${project}/bootstrapNode.js`),
		bundle.cache && fs.writeFile(cacheLocation, JSON.stringify(bundle.cache)),
		bundle.write({sourcemap: false, dir: "../build/", format: "esm"}),
		copyLibs()
	])
}

(async function () {
	try {
		console.log("Building")
		await build()
		await createUnitTestHtml()
		console.log("Testing")
		const statusCode = await runTest()
		process.exit(statusCode)
	} catch (e) {
		console.error(e)
		process.exit(1)
	}
})()


async function checkFlow() {
	return child_process.spawn(flow, [], {stdio: [process.stdin, process.stdout, process.stderr]})
}

function runTest() {
	if (testRunner != null) {
		console.log("> skipping test run as test are already executed")
	} else {
		return new Promise((resolve) => {
			let testRunner = child_process.fork(`../build/test/${project}/bootstrapNode.js`)
			testRunner.on('exit', (code) => {
				resolve(code)
				testRunner = null
			})
		})
	}
}

async function createUnitTestHtml(watch) {
	let localEnv = env.create(null, "unit-test", "Test")
	let imports = [`test-${project}.js`]

	const template = "System.import('./browser/test/bootstrapBrowser.js')"
	await _writeFile(`../build/test-${project}.js`, [
		`window.whitelabelCustomizations = null`,
		`window.env = ${JSON.stringify(localEnv, null, 2)}`,
		watch ? "new WebSocket('ws://localhost:8080').addEventListener('message', (e) => window.hotReload())" : "",
	].join("\n") + "\n" + template)

	const html = await renderHtml(imports, localEnv)
	await _writeFile(`../build/test-${project}.html`, html)

	await fs.copy(`${project}/bootstrapBrowser.js`, "../build/test/bootstrapBrowser.js")
}

function _writeFile(targetFile, content) {
	return fs.mkdirs(path.dirname(targetFile)).then(() => fs.writeFile(targetFile, content, 'utf-8'))
}
