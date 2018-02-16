"use strict";

tutao.provide('tutao.entity.tutanota.UnencryptedStatisticLogEntry');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._contactFormPath = null;
    this._date = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._contactFormPath = data.contactFormPath;
  this._date = data.date;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.MODEL_VERSION = '26';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.PATH = '/rest/tutanota/unencryptedstatisticlogentry';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAANv';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    contactFormPath: this._contactFormPath, 
    date: this._date
  };
};

/**
 * Provides the id of this UnencryptedStatisticLogEntry.
 * @return {Array.<string>} The id of this UnencryptedStatisticLogEntry.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this UnencryptedStatisticLogEntry.
 * @param {string} format The format of this UnencryptedStatisticLogEntry.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this UnencryptedStatisticLogEntry.
 * @return {string} The format of this UnencryptedStatisticLogEntry.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this UnencryptedStatisticLogEntry.
 * @param {string} ownerGroup The ownerGroup of this UnencryptedStatisticLogEntry.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this UnencryptedStatisticLogEntry.
 * @return {string} The ownerGroup of this UnencryptedStatisticLogEntry.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this UnencryptedStatisticLogEntry.
 * @param {string} permissions The permissions of this UnencryptedStatisticLogEntry.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this UnencryptedStatisticLogEntry.
 * @return {string} The permissions of this UnencryptedStatisticLogEntry.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the contactFormPath of this UnencryptedStatisticLogEntry.
 * @param {string} contactFormPath The contactFormPath of this UnencryptedStatisticLogEntry.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.setContactFormPath = function(contactFormPath) {
  this._contactFormPath = contactFormPath;
  return this;
};

/**
 * Provides the contactFormPath of this UnencryptedStatisticLogEntry.
 * @return {string} The contactFormPath of this UnencryptedStatisticLogEntry.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.getContactFormPath = function() {
  return this._contactFormPath;
};

/**
 * Sets the date of this UnencryptedStatisticLogEntry.
 * @param {Date} date The date of this UnencryptedStatisticLogEntry.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.setDate = function(date) {
  this._date = String(date.getTime());
  return this;
};

/**
 * Provides the date of this UnencryptedStatisticLogEntry.
 * @return {Date} The date of this UnencryptedStatisticLogEntry.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.getDate = function() {
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Loads a UnencryptedStatisticLogEntry from the server.
 * @param {Array.<string>} id The id of the UnencryptedStatisticLogEntry.
 * @return {Promise.<tutao.entity.tutanota.UnencryptedStatisticLogEntry>} Resolves to the UnencryptedStatisticLogEntry or an exception if the loading failed.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.UnencryptedStatisticLogEntry, tutao.entity.tutanota.UnencryptedStatisticLogEntry.PATH, id[1], id[0], {"v" : "26"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple UnencryptedStatisticLogEntrys from the server.
 * @param {Array.<Array.<string>>} ids The ids of the UnencryptedStatisticLogEntrys to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.UnencryptedStatisticLogEntry>>} Resolves to an array of UnencryptedStatisticLogEntry or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.UnencryptedStatisticLogEntry, tutao.entity.tutanota.UnencryptedStatisticLogEntry.PATH, ids, {"v": "26"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this UnencryptedStatisticLogEntry on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.UnencryptedStatisticLogEntry.PATH, this, {"v": "26"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of UnencryptedStatisticLogEntrys loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.tutanota.UnencryptedStatisticLogEntry>>} Resolves to an array of UnencryptedStatisticLogEntry or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.UnencryptedStatisticLogEntry, tutao.entity.tutanota.UnencryptedStatisticLogEntry.PATH, listId, start, count, reverse, {"v": "26"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.UnencryptedStatisticLogEntry.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
