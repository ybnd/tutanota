"use strict";

tutao.provide('tutao.entity.sys.DisabledFeature');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DisabledFeature = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._feature = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.DisabledFeature.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DisabledFeature.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._feature = data.feature;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.DisabledFeature.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    feature: this._feature
  };
};

/**
 * Sets the id of this DisabledFeature.
 * @param {string} id The id of this DisabledFeature.
 */
tutao.entity.sys.DisabledFeature.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this DisabledFeature.
 * @return {string} The id of this DisabledFeature.
 */
tutao.entity.sys.DisabledFeature.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the feature of this DisabledFeature.
 * @param {string} feature The feature of this DisabledFeature.
 */
tutao.entity.sys.DisabledFeature.prototype.setFeature = function(feature) {
  this._feature = feature;
  return this;
};

/**
 * Provides the feature of this DisabledFeature.
 * @return {string} The feature of this DisabledFeature.
 */
tutao.entity.sys.DisabledFeature.prototype.getFeature = function() {
  return this._feature;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.DisabledFeature.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
