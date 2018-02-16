"use strict";

tutao.provide('tutao.entity.sys.WhitelabelConfig');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.WhitelabelConfig = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._germanLanguageCode = null;
    this._jsonTheme = null;
    this._metaTags = null;
    this._bootstrapCustomizations = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.WhitelabelConfig.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.WhitelabelConfig.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._germanLanguageCode = data.germanLanguageCode;
  this._jsonTheme = data.jsonTheme;
  this._metaTags = data.metaTags;
  this._bootstrapCustomizations = [];
  for (var i=0; i < data.bootstrapCustomizations.length; i++) {
    this._bootstrapCustomizations.push(new tutao.entity.sys.BootstrapFeature(this, data.bootstrapCustomizations[i]));
  }
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.WhitelabelConfig.MODEL_VERSION = '28';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.WhitelabelConfig.PATH = '/rest/sys/whitelabelconfig';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.WhitelabelConfig.ROOT_INSTANCE_ID = 'A3N5cwAEZw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.WhitelabelConfig.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.WhitelabelConfig.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.WhitelabelConfig.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    germanLanguageCode: this._germanLanguageCode, 
    jsonTheme: this._jsonTheme, 
    metaTags: this._metaTags, 
    bootstrapCustomizations: tutao.entity.EntityHelper.aggregatesToJsonData(this._bootstrapCustomizations)
  };
};

/**
 * Provides the id of this WhitelabelConfig.
 * @return {string} The id of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this WhitelabelConfig.
 * @param {string} format The format of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this WhitelabelConfig.
 * @return {string} The format of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this WhitelabelConfig.
 * @param {string} ownerGroup The ownerGroup of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this WhitelabelConfig.
 * @return {string} The ownerGroup of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this WhitelabelConfig.
 * @param {string} permissions The permissions of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this WhitelabelConfig.
 * @return {string} The permissions of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the germanLanguageCode of this WhitelabelConfig.
 * @param {string} germanLanguageCode The germanLanguageCode of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.setGermanLanguageCode = function(germanLanguageCode) {
  this._germanLanguageCode = germanLanguageCode;
  return this;
};

/**
 * Provides the germanLanguageCode of this WhitelabelConfig.
 * @return {string} The germanLanguageCode of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.getGermanLanguageCode = function() {
  return this._germanLanguageCode;
};

/**
 * Sets the jsonTheme of this WhitelabelConfig.
 * @param {string} jsonTheme The jsonTheme of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.setJsonTheme = function(jsonTheme) {
  this._jsonTheme = jsonTheme;
  return this;
};

/**
 * Provides the jsonTheme of this WhitelabelConfig.
 * @return {string} The jsonTheme of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.getJsonTheme = function() {
  return this._jsonTheme;
};

/**
 * Sets the metaTags of this WhitelabelConfig.
 * @param {string} metaTags The metaTags of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.setMetaTags = function(metaTags) {
  this._metaTags = metaTags;
  return this;
};

/**
 * Provides the metaTags of this WhitelabelConfig.
 * @return {string} The metaTags of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.getMetaTags = function() {
  return this._metaTags;
};

/**
 * Provides the bootstrapCustomizations of this WhitelabelConfig.
 * @return {Array.<tutao.entity.sys.BootstrapFeature>} The bootstrapCustomizations of this WhitelabelConfig.
 */
tutao.entity.sys.WhitelabelConfig.prototype.getBootstrapCustomizations = function() {
  return this._bootstrapCustomizations;
};

/**
 * Loads a WhitelabelConfig from the server.
 * @param {string} id The id of the WhitelabelConfig.
 * @return {Promise.<tutao.entity.sys.WhitelabelConfig>} Resolves to the WhitelabelConfig or an exception if the loading failed.
 */
tutao.entity.sys.WhitelabelConfig.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.WhitelabelConfig, tutao.entity.sys.WhitelabelConfig.PATH, id, null, {"v" : "28"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple WhitelabelConfigs from the server.
 * @param {Array.<string>} ids The ids of the WhitelabelConfigs to load.
 * @return {Promise.<Array.<tutao.entity.sys.WhitelabelConfig>>} Resolves to an array of WhitelabelConfig or rejects with an exception if the loading failed.
 */
tutao.entity.sys.WhitelabelConfig.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.WhitelabelConfig, tutao.entity.sys.WhitelabelConfig.PATH, ids, {"v": "28"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this WhitelabelConfig on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.WhitelabelConfig.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.WhitelabelConfig.PATH, this, {"v": "28"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.WhitelabelConfig.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.WhitelabelConfig.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.WhitelabelConfig.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
