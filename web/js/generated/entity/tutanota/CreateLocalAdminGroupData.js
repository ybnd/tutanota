"use strict";

tutao.provide('tutao.entity.tutanota.CreateLocalAdminGroupData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateLocalAdminGroupData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._encryptedName = null;
    this._groupData = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.CreateLocalAdminGroupData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._encryptedName = data.encryptedName;
  this._groupData = (data.groupData) ? new tutao.entity.tutanota.InternalGroupData(this, data.groupData) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.MODEL_VERSION = '26';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.PATH = '/rest/tutanota/localadmingroupservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    encryptedName: this._encryptedName, 
    groupData: tutao.entity.EntityHelper.aggregatesToJsonData(this._groupData)
  };
};

/**
 * Sets the format of this CreateLocalAdminGroupData.
 * @param {string} format The format of this CreateLocalAdminGroupData.
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateLocalAdminGroupData.
 * @return {string} The format of this CreateLocalAdminGroupData.
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the encryptedName of this CreateLocalAdminGroupData.
 * @param {string} encryptedName The encryptedName of this CreateLocalAdminGroupData.
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.prototype.setEncryptedName = function(encryptedName) {
  this._encryptedName = encryptedName;
  return this;
};

/**
 * Provides the encryptedName of this CreateLocalAdminGroupData.
 * @return {string} The encryptedName of this CreateLocalAdminGroupData.
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.prototype.getEncryptedName = function() {
  return this._encryptedName;
};

/**
 * Sets the groupData of this CreateLocalAdminGroupData.
 * @param {tutao.entity.tutanota.InternalGroupData} groupData The groupData of this CreateLocalAdminGroupData.
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.prototype.setGroupData = function(groupData) {
  this._groupData = groupData;
  return this;
};

/**
 * Provides the groupData of this CreateLocalAdminGroupData.
 * @return {tutao.entity.tutanota.InternalGroupData} The groupData of this CreateLocalAdminGroupData.
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.prototype.getGroupData = function() {
  return this._groupData;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "26";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.CreateLocalAdminGroupData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.CreateLocalAdminGroupData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
