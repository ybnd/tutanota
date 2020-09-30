// @flow
import type {Element, ListElement} from "../common/EntityFunctions"
import {
	_eraseEntity,
	_loadEntity,
	_loadEntityRange,
	_loadMultipleEntities,
	_loadReverseRangeBetween,
	_setupEntity,
	_updateEntity,
	CUSTOM_MIN_ID,
	GENERATED_MIN_ID,
	getFirstIdIsBiggerFnForType,
	getLetId,
	RANGE_ITEM_LIMIT,
	resolveTypeReference,
	TypeRef
} from "../common/EntityFunctions"
import {assertMainOrNode} from "../Env"
import EC from "../common/EntityConstants"
import type {EntityRestInterface} from "../worker/rest/EntityRestClient"
import type {RootInstance} from "../entities/sys/RootInstance"
import {RootInstanceTypeRef} from "../entities/sys/RootInstance"

const Type = EC.Type
const ValueType = EC.ValueType

assertMainOrNode()

type SomeEntity = Element | ListElement


// TODO write testcases
/**
 * A class version of the functions in Entity.js which allows for injection of an EntityRestInterface
 */
export class EntityClient {
	_interface: EntityRestInterface

	constructor(iface: EntityRestInterface) {
		this._interface = iface
	}

	setup<T: SomeEntity>(listId: ?Id, instance: T): Promise<Id> {
		return _setupEntity(listId, instance, this._interface)
	}

	update<T: SomeEntity>(instance: T): Promise<void> {
		return _updateEntity(instance, this._interface)
	}

	erase<T: SomeEntity>(instance: T): Promise<void> {
		return _eraseEntity(instance, this._interface)
	}

	load<T: SomeEntity>(typeRef: TypeRef<T>, id: Id | IdTuple, queryParams: ?Params): Promise<T> {
		return _loadEntity(typeRef, id, queryParams, this._interface)
	}

	/**
	 * load multiple does not guarantee order or completeness of returned elements.
	 */
	loadMultiple<T: SomeEntity>(typeRef: TypeRef<T>, listId: ?Id, elementIds: Id[]): Promise<T[]> {
		return _loadMultipleEntities(typeRef, listId, elementIds, this._interface)
	}

	/**
	 * load multiple does not guarantee order or completeness of returned elements.
	 */
	loadMultipleList<T: ListElement>(typeRef: TypeRef<T>, listId: Id, elementIds: Id[]): Promise<T[]> {
		return _loadMultipleEntities(typeRef, listId, elementIds, this._interface)
	}

	loadRange<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number,
	                          reverse: boolean): Promise<T[]> {
		return _loadEntityRange(typeRef, listId, start, count, reverse, this._interface)
	}

	loadAll<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: ?Id, end: ?Id): Promise<T[]> {
		return resolveTypeReference(typeRef).then(typeModel => {
			if (!start) {
				start = (typeModel.values["_id"].type === ValueType.GeneratedId) ? GENERATED_MIN_ID : CUSTOM_MIN_ID
			}
			return this._loadAll(typeRef, listId, start, end)
		})
	}

	loadReverseRangeBetween<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: Id, end: Id, rangeItemLimit: number = RANGE_ITEM_LIMIT): Promise<{elements: T[], loadedCompletely: boolean}> {
		return _loadReverseRangeBetween(typeRef, listId, start, end, this._interface, rangeItemLimit)
	}

	loadVersion<T>(instance: T, version: Id): Promise<T> {
		return resolveTypeReference((instance: any)._type).then(typeModel => {
			if (!typeModel.versioned) throw new Error("unversioned instance: can't load version")
			return this.load((instance: any)._type, (instance: any)._id, {version})
		})
	}

	loadRoot<T: SomeEntity>(typeRef: TypeRef<T>, groupId: Id): Promise<T> {
		return resolveTypeReference(typeRef).then(typeModel => {
			let rootId = [groupId, typeModel.rootId];
			return this.load(RootInstanceTypeRef, rootId).then((root: RootInstance) => {
				return this.load(typeRef, root.reference)
			})
		})
	}

	_loadAll<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: Id, end: ?Id): Promise<T[]> {
		return resolveTypeReference(typeRef)
			.then(getFirstIdIsBiggerFnForType)
			.then((isFirstIdBigger) => {
				return this.loadRange(typeRef, listId, start, RANGE_ITEM_LIMIT, false).then(elements => {
					if (elements.length === 0) return Promise.resolve(elements)
					let lastElementId = getLetId(elements[elements.length - 1])[1]
					if (elements.length === RANGE_ITEM_LIMIT && (end == null || isFirstIdBigger(end, lastElementId[1]))) {
						return this._loadAll(typeRef, listId, lastElementId, end).then(nextElements => {
							return elements.concat(nextElements)
						})
					} else {
						return Promise.resolve(elements.filter(e => {
							if (end == null) {
								return true // no end element specified return full list
							} else {
								return isFirstIdBigger(end, getLetId(e)[1]) || end === getLetId(e)[1]
							}
						}))
					}
				})
			})
	}
}