import bluebird from "bluebird"
import crypto from "crypto"
import xhr2 from "xhr2"
import express from "express"
import server_destroy from "server-destroy"
import body_parser from "body-parser"

global.env = __TUTANOTA_ENV

// node environment: mock a few browser functions
global.Promise = bluebird.Promise
Promise.config({
	longStackTraces: true
})

global.isBrowser = false

global.btoa = function (str) {
	return Buffer.from(str, 'binary').toString('base64')
}
global.atob = function (b64Encoded) {
	return Buffer.from(b64Encoded, 'base64').toString('binary')
}
global.crypto = {
	getRandomValues: function (bytes) {
		let randomBytes = crypto.randomBytes(bytes.length)
		bytes.set(randomBytes)
	}
}

global.XMLHttpRequest = xhr2
global.express = express
global.enableDestroy = server_destroy
global.bodyParser = body_parser

global.WebSocket = function () {
}

const nowOffset = Date.now();
global.performance = {
	now: function () {
		return Date.now() - nowOffset;
	}
}

const noOp = () => {}

global.performance = {
	now: Date.now,
	mark: noOp,
	measure: noOp,
}

/**
 * runs this test exclusively on browsers (not node)
 */
global.browser = function (func) {
	return function () {
	}
}

/**
 * runs this test exclusively on node (not browsers)
 */
global.node = function (func) {
	return func
}

import("../../src/api/Env.js").then((module) => {
	module.bootFinished()
	import('./Suite.js')
})