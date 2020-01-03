//@flow
import {IndexerCore} from "./IndexerCore"
import type {Db, SearchIndexEntry} from "./SearchTypes"
import {EntityWorker} from "../EntityWorker"
import {FULL_INDEXED_TIMESTAMP, GroupType} from "../../common/TutanotaConstants"
import {CalendarGroupRootTypeRef} from "../../entities/tutanota/CalendarGroupRoot"
import {_TypeModel as CalendarModel, CalendarEventTypeRef} from "../../entities/tutanota/CalendarEvent"
import {neverNull} from "../../common/utils/Utils"
import {_createNewIndexUpdate, typeRefToTypeInfo} from "./IndexUtils"

export class CalendarIndexer {
	_core: IndexerCore;
	_db: Db;
	_entity: EntityWorker;

	constructor(core: IndexerCore, db: Db, entity: EntityWorker) {
		this._core = core
		this._db = db
		this._entity = entity
	}

	indexUserCalendars(user: User): Promise<void> {
		let indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(CalendarEventTypeRef))
		return Promise.map(user.memberships.filter(m => m.groupType === GroupType.Calendar), (calendarMembership) =>
			this._entity.load(CalendarGroupRootTypeRef, calendarMembership.group)
			    .then(calendarGroupRoot => this._entity.loadAll(CalendarEventTypeRef, calendarGroupRoot.shortEvents))
			    .then((events) => {
				    events.forEach((event) => {
					    const entries = this.createCalendarIndexEntries(event)
					    this._core.encryptSearchIndexEntries(event._id, neverNull(event._ownerGroup), entries, indexUpdate)
				    })
				    return this._core.writeIndexUpdate([
					    {
						    groupId: calendarMembership.group,
						    indexTimestamp: FULL_INDEXED_TIMESTAMP
					    }
				    ], indexUpdate)
			    })
		).return()
	}

	createCalendarIndexEntries(event: CalendarEvent): Map<string, SearchIndexEntry[]> {
		return this._core.createIndexEntriesForAttributes(CalendarModel, event, [
			{
				attribute: CalendarModel.values["summary"],
				value: () => event.summary
			}
		])
	}
}
