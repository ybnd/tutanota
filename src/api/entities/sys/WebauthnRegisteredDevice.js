// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const WebauthnRegisteredDeviceTypeRef: TypeRef<WebauthnRegisteredDevice> = new TypeRef("sys", "WebauthnRegisteredDevice")
export const _TypeModel: TypeModel = {
	"name": "WebauthnRegisteredDevice",
	"since": 62,
	"type": "AGGREGATED_TYPE",
	"id": 1755,
	"rootId": "A3N5cwAG2w",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1756,
			"since": 62,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"counter": {
			"name": "counter",
			"id": 1759,
			"since": 62,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"keyHandle": {
			"name": "keyHandle",
			"id": 1757,
			"since": 62,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"publicKey": {
			"name": "publicKey",
			"id": 1758,
			"since": 62,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "62"
}

export function createWebauthnRegisteredDevice(values?: $Shape<$Exact<WebauthnRegisteredDevice>>): WebauthnRegisteredDevice {
	return Object.assign(create(_TypeModel, WebauthnRegisteredDeviceTypeRef), values)
}

export type WebauthnRegisteredDevice = {
	_type: TypeRef<WebauthnRegisteredDevice>;

	_id: Id;
	counter: NumberString;
	keyHandle: Uint8Array;
	publicKey: Uint8Array;
}