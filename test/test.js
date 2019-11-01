const Promise = require('bluebird')
const path = require("path")
const destDir = path.join(__dirname, "../build/")
const fs = Promise.Promise.promisifyAll(require("fs-extra"))
const child_process = require('child_process')
const env = require('../buildSrc/env.js')
const LaunchHtml = require('../buildSrc/LaunchHtml.js')
const SystemConfig = require('../buildSrc/SystemConfig.js')
const rollup = require("rollup")
const flow = require('flow-bin')
const {rollupDebugPlugins} = require("../buildSrc/RollupConfig")


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
	return fs.copyAsync('../libs', '../build/libs')
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
		fs.copyFileAsync(`${project}/bootstrapNode.js`, `../build/node/test/${project}/bootstrapNode.js`),
		bundle.cache && await fs.writeFileAsync(cacheLocation, JSON.stringify(bundle.cache)),
		// Error: UMD and IIFE output formats are not supported for code-splitting builds.
		bundle.write({sourcemap: false, dir: "../build/node", format: "cjs"}),
		bundle.write({sourcemap: "inline", dir: "../build/browser", format: "system"}),
		copyLibs()
	])
}

(async function () {
	try {
		console.log("Building")
		await build()
		console.log("Testing")
		await createUnitTestHtml()
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
			let testRunner = child_process.fork(`../build/node/test/${project}/bootstrapNode.js`)
			testRunner.on('exit', (code) => {
				resolve(code)
				testRunner = null
			})
		})
	}
}

async function createUnitTestHtml(watch) {
	let localEnv = env.create(SystemConfig.devTestConfig(), null, "unit-test", "Test")
	let imports = SystemConfig.baseDevDependencies.concat([`test-${project}.js`])

	const template = "System.import('./browser/test/bootstrapBrowser.js')"
	await _writeFile(`../build/test-${project}.js`, [
		`window.whitelabelCustomizations = null`,
		`window.env = ${JSON.stringify(localEnv, null, 2)}`,
		watch ? "new WebSocket('ws://localhost:8080').addEventListener('message', (e) => window.hotReload())" : "",
	].join("\n") + "\n" + template)

	const html = await LaunchHtml.renderHtml(imports, localEnv)
	await _writeFile(`../build/test-${project}.html`, html)

	fs.copyFileSync(`${project}/bootstrapBrowser.js`, "../build/browser/test/bootstrapBrowser.js")
}

function _writeFile(targetFile, content) {
	return fs.mkdirsAsync(path.dirname(targetFile)).then(() => fs.writeFileAsync(targetFile, content, 'utf-8'))
}
