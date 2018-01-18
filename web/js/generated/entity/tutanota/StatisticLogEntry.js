"use strict";

tutao.provide('tutao.entity.tutanota.StatisticLogEntry');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.StatisticLogEntry = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._date = null;
    this._contactForm = null;
    this._values = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.StatisticLogEntry.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._date = data.date;
  this._contactForm = data.contactForm;
  this._values = [];
  for (var i=0; i < data.values.length; i++) {
    this._values.push(new tutao.entity.tutanota.ContactFormEncryptedStatisticsField(this, data.values[i]));
  }
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.StatisticLogEntry.MODEL_VERSION = '24';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.StatisticLogEntry.PATH = '/rest/tutanota/statisticlogentry';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.StatisticLogEntry.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAAMF';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.StatisticLogEntry.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    date: this._date, 
    contactForm: this._contactForm, 
    values: tutao.entity.EntityHelper.aggregatesToJsonData(this._values)
  };
};

/**
 * Provides the id of this StatisticLogEntry.
 * @return {Array.<string>} The id of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this StatisticLogEntry.
 * @param {string} format The format of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this StatisticLogEntry.
 * @return {string} The format of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerEncSessionKey of this StatisticLogEntry.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this StatisticLogEntry.
 * @return {string} The ownerEncSessionKey of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this StatisticLogEntry.
 * @param {string} ownerGroup The ownerGroup of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this StatisticLogEntry.
 * @return {string} The ownerGroup of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this StatisticLogEntry.
 * @param {string} permissions The permissions of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this StatisticLogEntry.
 * @return {string} The permissions of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the date of this StatisticLogEntry.
 * @param {Date} date The date of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.setDate = function(date) {
  this._date = String(date.getTime());
  return this;
};

/**
 * Provides the date of this StatisticLogEntry.
 * @return {Date} The date of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.getDate = function() {
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the contactForm of this StatisticLogEntry.
 * @param {Array.<string>} contactForm The contactForm of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.setContactForm = function(contactForm) {
  this._contactForm = contactForm;
  return this;
};

/**
 * Provides the contactForm of this StatisticLogEntry.
 * @return {Array.<string>} The contactForm of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.getContactForm = function() {
  return this._contactForm;
};

/**
 * Loads the contactForm of this StatisticLogEntry.
 * @return {Promise.<tutao.entity.tutanota.ContactForm>} Resolves to the loaded contactForm of this StatisticLogEntry or an exception if the loading failed.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.loadContactForm = function() {
  return tutao.entity.tutanota.ContactForm.load(this._contactForm);
};

/**
 * Provides the values of this StatisticLogEntry.
 * @return {Array.<tutao.entity.tutanota.ContactFormEncryptedStatisticsField>} The values of this StatisticLogEntry.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.getValues = function() {
  return this._values;
};

/**
 * Loads a StatisticLogEntry from the server.
 * @param {Array.<string>} id The id of the StatisticLogEntry.
 * @return {Promise.<tutao.entity.tutanota.StatisticLogEntry>} Resolves to the StatisticLogEntry or an exception if the loading failed.
 */
tutao.entity.tutanota.StatisticLogEntry.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.StatisticLogEntry, tutao.entity.tutanota.StatisticLogEntry.PATH, id[1], id[0], {"v" : "24"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple StatisticLogEntrys from the server.
 * @param {Array.<Array.<string>>} ids The ids of the StatisticLogEntrys to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.StatisticLogEntry>>} Resolves to an array of StatisticLogEntry or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.StatisticLogEntry.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.StatisticLogEntry, tutao.entity.tutanota.StatisticLogEntry.PATH, ids, {"v": "24"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "24";
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.StatisticLogEntry.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this StatisticLogEntry on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.StatisticLogEntry.PATH, this, {"v": "24"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of StatisticLogEntrys loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.tutanota.StatisticLogEntry>>} Resolves to an array of StatisticLogEntry or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.StatisticLogEntry.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.StatisticLogEntry, tutao.entity.tutanota.StatisticLogEntry.PATH, listId, start, count, reverse, {"v": "24"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.StatisticLogEntry.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
