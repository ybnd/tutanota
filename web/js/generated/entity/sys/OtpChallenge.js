"use strict";

tutao.provide('tutao.entity.sys.OtpChallenge');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.OtpChallenge = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._secondFactors = [];
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.OtpChallenge.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.OtpChallenge.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._secondFactors = data.secondFactors;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.OtpChallenge.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    secondFactors: this._secondFactors
  };
};

/**
 * Sets the id of this OtpChallenge.
 * @param {string} id The id of this OtpChallenge.
 */
tutao.entity.sys.OtpChallenge.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this OtpChallenge.
 * @return {string} The id of this OtpChallenge.
 */
tutao.entity.sys.OtpChallenge.prototype.getId = function() {
  return this.__id;
};

/**
 * Provides the secondFactors of this OtpChallenge.
 * @return {Array.<Array.<string>>} The secondFactors of this OtpChallenge.
 */
tutao.entity.sys.OtpChallenge.prototype.getSecondFactors = function() {
  return this._secondFactors;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.OtpChallenge.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
