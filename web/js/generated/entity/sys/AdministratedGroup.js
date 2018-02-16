"use strict";

tutao.provide('tutao.entity.sys.AdministratedGroup');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AdministratedGroup = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._groupType = null;
    this._groupInfo = null;
    this._localAdminGroup = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.AdministratedGroup.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AdministratedGroup.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._groupType = data.groupType;
  this._groupInfo = data.groupInfo;
  this._localAdminGroup = data.localAdminGroup;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.AdministratedGroup.MODEL_VERSION = '28';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.AdministratedGroup.PATH = '/rest/sys/administratedgroup';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.AdministratedGroup.ROOT_INSTANCE_ID = 'A3N5cwAFDg';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.AdministratedGroup.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.AdministratedGroup.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.AdministratedGroup.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    groupType: this._groupType, 
    groupInfo: this._groupInfo, 
    localAdminGroup: this._localAdminGroup
  };
};

/**
 * Provides the id of this AdministratedGroup.
 * @return {Array.<string>} The id of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this AdministratedGroup.
 * @param {string} format The format of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this AdministratedGroup.
 * @return {string} The format of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this AdministratedGroup.
 * @param {string} ownerGroup The ownerGroup of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this AdministratedGroup.
 * @return {string} The ownerGroup of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this AdministratedGroup.
 * @param {string} permissions The permissions of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this AdministratedGroup.
 * @return {string} The permissions of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the groupType of this AdministratedGroup.
 * @param {string} groupType The groupType of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.setGroupType = function(groupType) {
  this._groupType = groupType;
  return this;
};

/**
 * Provides the groupType of this AdministratedGroup.
 * @return {string} The groupType of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.getGroupType = function() {
  return this._groupType;
};

/**
 * Sets the groupInfo of this AdministratedGroup.
 * @param {Array.<string>} groupInfo The groupInfo of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.setGroupInfo = function(groupInfo) {
  this._groupInfo = groupInfo;
  return this;
};

/**
 * Provides the groupInfo of this AdministratedGroup.
 * @return {Array.<string>} The groupInfo of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.getGroupInfo = function() {
  return this._groupInfo;
};

/**
 * Loads the groupInfo of this AdministratedGroup.
 * @return {Promise.<tutao.entity.sys.GroupInfo>} Resolves to the loaded groupInfo of this AdministratedGroup or an exception if the loading failed.
 */
tutao.entity.sys.AdministratedGroup.prototype.loadGroupInfo = function() {
  return tutao.entity.sys.GroupInfo.load(this._groupInfo);
};

/**
 * Sets the localAdminGroup of this AdministratedGroup.
 * @param {string} localAdminGroup The localAdminGroup of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.setLocalAdminGroup = function(localAdminGroup) {
  this._localAdminGroup = localAdminGroup;
  return this;
};

/**
 * Provides the localAdminGroup of this AdministratedGroup.
 * @return {string} The localAdminGroup of this AdministratedGroup.
 */
tutao.entity.sys.AdministratedGroup.prototype.getLocalAdminGroup = function() {
  return this._localAdminGroup;
};

/**
 * Loads the localAdminGroup of this AdministratedGroup.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded localAdminGroup of this AdministratedGroup or an exception if the loading failed.
 */
tutao.entity.sys.AdministratedGroup.prototype.loadLocalAdminGroup = function() {
  return tutao.entity.sys.Group.load(this._localAdminGroup);
};

/**
 * Loads a AdministratedGroup from the server.
 * @param {Array.<string>} id The id of the AdministratedGroup.
 * @return {Promise.<tutao.entity.sys.AdministratedGroup>} Resolves to the AdministratedGroup or an exception if the loading failed.
 */
tutao.entity.sys.AdministratedGroup.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.AdministratedGroup, tutao.entity.sys.AdministratedGroup.PATH, id[1], id[0], {"v" : "28"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple AdministratedGroups from the server.
 * @param {Array.<Array.<string>>} ids The ids of the AdministratedGroups to load.
 * @return {Promise.<Array.<tutao.entity.sys.AdministratedGroup>>} Resolves to an array of AdministratedGroup or rejects with an exception if the loading failed.
 */
tutao.entity.sys.AdministratedGroup.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.AdministratedGroup, tutao.entity.sys.AdministratedGroup.PATH, ids, {"v": "28"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this AdministratedGroup on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.AdministratedGroup.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.AdministratedGroup.PATH, this, {"v": "28"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of AdministratedGroups loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.AdministratedGroup>>} Resolves to an array of AdministratedGroup or rejects with an exception if the loading failed.
 */
tutao.entity.sys.AdministratedGroup.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.AdministratedGroup, tutao.entity.sys.AdministratedGroup.PATH, listId, start, count, reverse, {"v": "28"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.AdministratedGroup.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.AdministratedGroup.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.AdministratedGroup.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
