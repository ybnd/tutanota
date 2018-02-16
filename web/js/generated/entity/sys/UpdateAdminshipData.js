"use strict";

tutao.provide('tutao.entity.sys.UpdateAdminshipData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UpdateAdminshipData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._newAdminGroupEncGKey = null;
    this._group = null;
    this._newAdminGroup = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.UpdateAdminshipData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._newAdminGroupEncGKey = data.newAdminGroupEncGKey;
  this._group = data.group;
  this._newAdminGroup = data.newAdminGroup;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.UpdateAdminshipData.MODEL_VERSION = '28';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.UpdateAdminshipData.PATH = '/rest/sys/updateadminshipservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.UpdateAdminshipData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    newAdminGroupEncGKey: this._newAdminGroupEncGKey, 
    group: this._group, 
    newAdminGroup: this._newAdminGroup
  };
};

/**
 * Sets the format of this UpdateAdminshipData.
 * @param {string} format The format of this UpdateAdminshipData.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this UpdateAdminshipData.
 * @return {string} The format of this UpdateAdminshipData.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the newAdminGroupEncGKey of this UpdateAdminshipData.
 * @param {string} newAdminGroupEncGKey The newAdminGroupEncGKey of this UpdateAdminshipData.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.setNewAdminGroupEncGKey = function(newAdminGroupEncGKey) {
  this._newAdminGroupEncGKey = newAdminGroupEncGKey;
  return this;
};

/**
 * Provides the newAdminGroupEncGKey of this UpdateAdminshipData.
 * @return {string} The newAdminGroupEncGKey of this UpdateAdminshipData.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.getNewAdminGroupEncGKey = function() {
  return this._newAdminGroupEncGKey;
};

/**
 * Sets the group of this UpdateAdminshipData.
 * @param {string} group The group of this UpdateAdminshipData.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this UpdateAdminshipData.
 * @return {string} The group of this UpdateAdminshipData.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.getGroup = function() {
  return this._group;
};

/**
 * Loads the group of this UpdateAdminshipData.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded group of this UpdateAdminshipData or an exception if the loading failed.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.loadGroup = function() {
  return tutao.entity.sys.Group.load(this._group);
};

/**
 * Sets the newAdminGroup of this UpdateAdminshipData.
 * @param {string} newAdminGroup The newAdminGroup of this UpdateAdminshipData.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.setNewAdminGroup = function(newAdminGroup) {
  this._newAdminGroup = newAdminGroup;
  return this;
};

/**
 * Provides the newAdminGroup of this UpdateAdminshipData.
 * @return {string} The newAdminGroup of this UpdateAdminshipData.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.getNewAdminGroup = function() {
  return this._newAdminGroup;
};

/**
 * Loads the newAdminGroup of this UpdateAdminshipData.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded newAdminGroup of this UpdateAdminshipData or an exception if the loading failed.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.loadNewAdminGroup = function() {
  return tutao.entity.sys.Group.load(this._newAdminGroup);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "28";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.UpdateAdminshipData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.UpdateAdminshipData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
