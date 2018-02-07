"use strict";

tutao.provide('tutao.entity.tutanota.InternalGroupData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.InternalGroupData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._adminEncGroupKey = null;
    this._groupEncPrivateKey = null;
    this._ownerEncGroupInfoSessionKey = null;
    this._publicKey = null;
    this._adminGroup = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.InternalGroupData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.InternalGroupData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._adminEncGroupKey = data.adminEncGroupKey;
  this._groupEncPrivateKey = data.groupEncPrivateKey;
  this._ownerEncGroupInfoSessionKey = data.ownerEncGroupInfoSessionKey;
  this._publicKey = data.publicKey;
  this._adminGroup = data.adminGroup;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.InternalGroupData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    adminEncGroupKey: this._adminEncGroupKey, 
    groupEncPrivateKey: this._groupEncPrivateKey, 
    ownerEncGroupInfoSessionKey: this._ownerEncGroupInfoSessionKey, 
    publicKey: this._publicKey, 
    adminGroup: this._adminGroup
  };
};

/**
 * Sets the id of this InternalGroupData.
 * @param {string} id The id of this InternalGroupData.
 */
tutao.entity.tutanota.InternalGroupData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this InternalGroupData.
 * @return {string} The id of this InternalGroupData.
 */
tutao.entity.tutanota.InternalGroupData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the adminEncGroupKey of this InternalGroupData.
 * @param {string} adminEncGroupKey The adminEncGroupKey of this InternalGroupData.
 */
tutao.entity.tutanota.InternalGroupData.prototype.setAdminEncGroupKey = function(adminEncGroupKey) {
  this._adminEncGroupKey = adminEncGroupKey;
  return this;
};

/**
 * Provides the adminEncGroupKey of this InternalGroupData.
 * @return {string} The adminEncGroupKey of this InternalGroupData.
 */
tutao.entity.tutanota.InternalGroupData.prototype.getAdminEncGroupKey = function() {
  return this._adminEncGroupKey;
};

/**
 * Sets the groupEncPrivateKey of this InternalGroupData.
 * @param {string} groupEncPrivateKey The groupEncPrivateKey of this InternalGroupData.
 */
tutao.entity.tutanota.InternalGroupData.prototype.setGroupEncPrivateKey = function(groupEncPrivateKey) {
  this._groupEncPrivateKey = groupEncPrivateKey;
  return this;
};

/**
 * Provides the groupEncPrivateKey of this InternalGroupData.
 * @return {string} The groupEncPrivateKey of this InternalGroupData.
 */
tutao.entity.tutanota.InternalGroupData.prototype.getGroupEncPrivateKey = function() {
  return this._groupEncPrivateKey;
};

/**
 * Sets the ownerEncGroupInfoSessionKey of this InternalGroupData.
 * @param {string} ownerEncGroupInfoSessionKey The ownerEncGroupInfoSessionKey of this InternalGroupData.
 */
tutao.entity.tutanota.InternalGroupData.prototype.setOwnerEncGroupInfoSessionKey = function(ownerEncGroupInfoSessionKey) {
  this._ownerEncGroupInfoSessionKey = ownerEncGroupInfoSessionKey;
  return this;
};

/**
 * Provides the ownerEncGroupInfoSessionKey of this InternalGroupData.
 * @return {string} The ownerEncGroupInfoSessionKey of this InternalGroupData.
 */
tutao.entity.tutanota.InternalGroupData.prototype.getOwnerEncGroupInfoSessionKey = function() {
  return this._ownerEncGroupInfoSessionKey;
};

/**
 * Sets the publicKey of this InternalGroupData.
 * @param {string} publicKey The publicKey of this InternalGroupData.
 */
tutao.entity.tutanota.InternalGroupData.prototype.setPublicKey = function(publicKey) {
  this._publicKey = publicKey;
  return this;
};

/**
 * Provides the publicKey of this InternalGroupData.
 * @return {string} The publicKey of this InternalGroupData.
 */
tutao.entity.tutanota.InternalGroupData.prototype.getPublicKey = function() {
  return this._publicKey;
};

/**
 * Sets the adminGroup of this InternalGroupData.
 * @param {string} adminGroup The adminGroup of this InternalGroupData.
 */
tutao.entity.tutanota.InternalGroupData.prototype.setAdminGroup = function(adminGroup) {
  this._adminGroup = adminGroup;
  return this;
};

/**
 * Provides the adminGroup of this InternalGroupData.
 * @return {string} The adminGroup of this InternalGroupData.
 */
tutao.entity.tutanota.InternalGroupData.prototype.getAdminGroup = function() {
  return this._adminGroup;
};

/**
 * Loads the adminGroup of this InternalGroupData.
 * @return {Promise.<tutao.entity.tutanota.Group>} Resolves to the loaded adminGroup of this InternalGroupData or an exception if the loading failed.
 */
tutao.entity.tutanota.InternalGroupData.prototype.loadAdminGroup = function() {
  return tutao.entity.tutanota.Group.load(this._adminGroup);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.InternalGroupData.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
