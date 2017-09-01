"use strict";

tutao.provide('tutao.entity.tutanota.ContactFormStatisticField');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormStatisticField = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._encryptedName = null;
    this._encryptedValue = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.ContactFormStatisticField.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._encryptedName = data.encryptedName;
  this._encryptedValue = data.encryptedValue;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    encryptedName: this._encryptedName, 
    encryptedValue: this._encryptedValue
  };
};

/**
 * Sets the id of this ContactFormStatisticField.
 * @param {string} id The id of this ContactFormStatisticField.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this ContactFormStatisticField.
 * @return {string} The id of this ContactFormStatisticField.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the encryptedName of this ContactFormStatisticField.
 * @param {string} encryptedName The encryptedName of this ContactFormStatisticField.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.setEncryptedName = function(encryptedName) {
  this._encryptedName = encryptedName;
  return this;
};

/**
 * Provides the encryptedName of this ContactFormStatisticField.
 * @return {string} The encryptedName of this ContactFormStatisticField.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.getEncryptedName = function() {
  return this._encryptedName;
};

/**
 * Sets the encryptedValue of this ContactFormStatisticField.
 * @param {string} encryptedValue The encryptedValue of this ContactFormStatisticField.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.setEncryptedValue = function(encryptedValue) {
  this._encryptedValue = encryptedValue;
  return this;
};

/**
 * Provides the encryptedValue of this ContactFormStatisticField.
 * @return {string} The encryptedValue of this ContactFormStatisticField.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.getEncryptedValue = function() {
  return this._encryptedValue;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
