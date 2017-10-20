"use strict";

tutao.provide('tutao.entity.tutanota.PhotosRef');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.PhotosRef = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._files = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.PhotosRef.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.PhotosRef.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._files = data.files;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.PhotosRef.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    files: this._files
  };
};

/**
 * Sets the id of this PhotosRef.
 * @param {string} id The id of this PhotosRef.
 */
tutao.entity.tutanota.PhotosRef.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this PhotosRef.
 * @return {string} The id of this PhotosRef.
 */
tutao.entity.tutanota.PhotosRef.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the files of this PhotosRef.
 * @param {string} files The files of this PhotosRef.
 */
tutao.entity.tutanota.PhotosRef.prototype.setFiles = function(files) {
  this._files = files;
  return this;
};

/**
 * Provides the files of this PhotosRef.
 * @return {string} The files of this PhotosRef.
 */
tutao.entity.tutanota.PhotosRef.prototype.getFiles = function() {
  return this._files;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.PhotosRef.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
