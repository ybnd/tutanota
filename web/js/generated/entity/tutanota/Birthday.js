"use strict";

tutao.provide('tutao.entity.tutanota.Birthday');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Birthday = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._day = null;
    this._month = null;
    this._year = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.Birthday.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Birthday.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._day = data.day;
  this._month = data.month;
  this._year = data.year;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.Birthday.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    day: this._day, 
    month: this._month, 
    year: this._year
  };
};

/**
 * Sets the id of this Birthday.
 * @param {string} id The id of this Birthday.
 */
tutao.entity.tutanota.Birthday.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this Birthday.
 * @return {string} The id of this Birthday.
 */
tutao.entity.tutanota.Birthday.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the day of this Birthday.
 * @param {string} day The day of this Birthday.
 */
tutao.entity.tutanota.Birthday.prototype.setDay = function(day) {
  this._day = day;
  return this;
};

/**
 * Provides the day of this Birthday.
 * @return {string} The day of this Birthday.
 */
tutao.entity.tutanota.Birthday.prototype.getDay = function() {
  return this._day;
};

/**
 * Sets the month of this Birthday.
 * @param {string} month The month of this Birthday.
 */
tutao.entity.tutanota.Birthday.prototype.setMonth = function(month) {
  this._month = month;
  return this;
};

/**
 * Provides the month of this Birthday.
 * @return {string} The month of this Birthday.
 */
tutao.entity.tutanota.Birthday.prototype.getMonth = function() {
  return this._month;
};

/**
 * Sets the year of this Birthday.
 * @param {string} year The year of this Birthday.
 */
tutao.entity.tutanota.Birthday.prototype.setYear = function(year) {
  this._year = year;
  return this;
};

/**
 * Provides the year of this Birthday.
 * @return {string} The year of this Birthday.
 */
tutao.entity.tutanota.Birthday.prototype.getYear = function() {
  return this._year;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.Birthday.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
