// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const OutOfOfficeNotificationTypeRef: TypeRef<OutOfOfficeNotification> = new TypeRef("tutanota", "OutOfOfficeNotification")
export const _TypeModel: TypeModel = {
	"name": "OutOfOfficeNotification",
	"since": 42,
	"type": "ELEMENT_TYPE",
	"id": 1084,
	"rootId": "CHR1dGFub3RhAAQ8",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1088,
			"since": 42,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1086,
			"since": 42,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1089,
			"since": 42,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1087,
			"since": 42,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"endTime": {
			"name": "endTime",
			"id": 1092,
			"since": 42,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"message": {
			"name": "message",
			"id": 1090,
			"since": 42,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"startTime": {
			"name": "startTime",
			"id": 1091,
			"since": 42,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "42"
}

export function createOutOfOfficeNotification(values?: $Shape<$Exact<OutOfOfficeNotification>>): OutOfOfficeNotification {
	return Object.assign(create(_TypeModel, OutOfOfficeNotificationTypeRef), values)
}

export type OutOfOfficeNotification = {
	_type: TypeRef<OutOfOfficeNotification>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;
	endTime: ?Date;
	message: string;
	startTime: Date;
}