"use strict";

tutao.provide('tutao.entity.tutanota.ContactFormStatisticEntry');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormStatisticEntry = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._bucketEncSessionKey = null;
    this._customerPubEncBucketKey = null;
    this._customerPubKeyVersion = null;
    this._statisticFields = [];
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.ContactFormStatisticEntry.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormStatisticEntry.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._bucketEncSessionKey = data.bucketEncSessionKey;
  this._customerPubEncBucketKey = data.customerPubEncBucketKey;
  this._customerPubKeyVersion = data.customerPubKeyVersion;
  this._statisticFields = [];
  for (var i=0; i < data.statisticFields.length; i++) {
    this._statisticFields.push(new tutao.entity.tutanota.ContactFormStatisticField(parent, data.statisticFields[i]));
  }
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactFormStatisticEntry.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    bucketEncSessionKey: this._bucketEncSessionKey, 
    customerPubEncBucketKey: this._customerPubEncBucketKey, 
    customerPubKeyVersion: this._customerPubKeyVersion, 
    statisticFields: tutao.entity.EntityHelper.aggregatesToJsonData(this._statisticFields)
  };
};

/**
 * Sets the id of this ContactFormStatisticEntry.
 * @param {string} id The id of this ContactFormStatisticEntry.
 */
tutao.entity.tutanota.ContactFormStatisticEntry.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this ContactFormStatisticEntry.
 * @return {string} The id of this ContactFormStatisticEntry.
 */
tutao.entity.tutanota.ContactFormStatisticEntry.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the bucketEncSessionKey of this ContactFormStatisticEntry.
 * @param {string} bucketEncSessionKey The bucketEncSessionKey of this ContactFormStatisticEntry.
 */
tutao.entity.tutanota.ContactFormStatisticEntry.prototype.setBucketEncSessionKey = function(bucketEncSessionKey) {
  this._bucketEncSessionKey = bucketEncSessionKey;
  return this;
};

/**
 * Provides the bucketEncSessionKey of this ContactFormStatisticEntry.
 * @return {string} The bucketEncSessionKey of this ContactFormStatisticEntry.
 */
tutao.entity.tutanota.ContactFormStatisticEntry.prototype.getBucketEncSessionKey = function() {
  return this._bucketEncSessionKey;
};

/**
 * Sets the customerPubEncBucketKey of this ContactFormStatisticEntry.
 * @param {string} customerPubEncBucketKey The customerPubEncBucketKey of this ContactFormStatisticEntry.
 */
tutao.entity.tutanota.ContactFormStatisticEntry.prototype.setCustomerPubEncBucketKey = function(customerPubEncBucketKey) {
  this._customerPubEncBucketKey = customerPubEncBucketKey;
  return this;
};

/**
 * Provides the customerPubEncBucketKey of this ContactFormStatisticEntry.
 * @return {string} The customerPubEncBucketKey of this ContactFormStatisticEntry.
 */
tutao.entity.tutanota.ContactFormStatisticEntry.prototype.getCustomerPubEncBucketKey = function() {
  return this._customerPubEncBucketKey;
};

/**
 * Sets the customerPubKeyVersion of this ContactFormStatisticEntry.
 * @param {string} customerPubKeyVersion The customerPubKeyVersion of this ContactFormStatisticEntry.
 */
tutao.entity.tutanota.ContactFormStatisticEntry.prototype.setCustomerPubKeyVersion = function(customerPubKeyVersion) {
  this._customerPubKeyVersion = customerPubKeyVersion;
  return this;
};

/**
 * Provides the customerPubKeyVersion of this ContactFormStatisticEntry.
 * @return {string} The customerPubKeyVersion of this ContactFormStatisticEntry.
 */
tutao.entity.tutanota.ContactFormStatisticEntry.prototype.getCustomerPubKeyVersion = function() {
  return this._customerPubKeyVersion;
};

/**
 * Provides the statisticFields of this ContactFormStatisticEntry.
 * @return {Array.<tutao.entity.tutanota.ContactFormStatisticField>} The statisticFields of this ContactFormStatisticEntry.
 */
tutao.entity.tutanota.ContactFormStatisticEntry.prototype.getStatisticFields = function() {
  return this._statisticFields;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ContactFormStatisticEntry.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
