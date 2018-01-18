"use strict";

tutao.provide('tutao.entity.sys.WhitelabelParent');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.WhitelabelParent = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._customer = null;
    this._whitelabelChildInParent = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.WhitelabelParent.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.WhitelabelParent.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._customer = data.customer;
  this._whitelabelChildInParent = data.whitelabelChildInParent;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.WhitelabelParent.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    customer: this._customer, 
    whitelabelChildInParent: this._whitelabelChildInParent
  };
};

/**
 * Sets the id of this WhitelabelParent.
 * @param {string} id The id of this WhitelabelParent.
 */
tutao.entity.sys.WhitelabelParent.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this WhitelabelParent.
 * @return {string} The id of this WhitelabelParent.
 */
tutao.entity.sys.WhitelabelParent.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the customer of this WhitelabelParent.
 * @param {string} customer The customer of this WhitelabelParent.
 */
tutao.entity.sys.WhitelabelParent.prototype.setCustomer = function(customer) {
  this._customer = customer;
  return this;
};

/**
 * Provides the customer of this WhitelabelParent.
 * @return {string} The customer of this WhitelabelParent.
 */
tutao.entity.sys.WhitelabelParent.prototype.getCustomer = function() {
  return this._customer;
};

/**
 * Loads the customer of this WhitelabelParent.
 * @return {Promise.<tutao.entity.sys.Customer>} Resolves to the loaded customer of this WhitelabelParent or an exception if the loading failed.
 */
tutao.entity.sys.WhitelabelParent.prototype.loadCustomer = function() {
  return tutao.entity.sys.Customer.load(this._customer);
};

/**
 * Sets the whitelabelChildInParent of this WhitelabelParent.
 * @param {Array.<string>} whitelabelChildInParent The whitelabelChildInParent of this WhitelabelParent.
 */
tutao.entity.sys.WhitelabelParent.prototype.setWhitelabelChildInParent = function(whitelabelChildInParent) {
  this._whitelabelChildInParent = whitelabelChildInParent;
  return this;
};

/**
 * Provides the whitelabelChildInParent of this WhitelabelParent.
 * @return {Array.<string>} The whitelabelChildInParent of this WhitelabelParent.
 */
tutao.entity.sys.WhitelabelParent.prototype.getWhitelabelChildInParent = function() {
  return this._whitelabelChildInParent;
};

/**
 * Loads the whitelabelChildInParent of this WhitelabelParent.
 * @return {Promise.<tutao.entity.sys.WhitelabelChild>} Resolves to the loaded whitelabelChildInParent of this WhitelabelParent or an exception if the loading failed.
 */
tutao.entity.sys.WhitelabelParent.prototype.loadWhitelabelChildInParent = function() {
  return tutao.entity.sys.WhitelabelChild.load(this._whitelabelChildInParent);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.WhitelabelParent.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
