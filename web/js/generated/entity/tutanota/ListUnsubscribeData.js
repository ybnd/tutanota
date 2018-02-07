"use strict";

tutao.provide('tutao.entity.tutanota.ListUnsubscribeData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ListUnsubscribeData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._headers = null;
    this._recipient = null;
    this._mail = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.ListUnsubscribeData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._headers = data.headers;
  this._recipient = data.recipient;
  this._mail = data.mail;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.ListUnsubscribeData.MODEL_VERSION = '25';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.ListUnsubscribeData.PATH = '/rest/tutanota/listunsubscribeservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    headers: this._headers, 
    recipient: this._recipient, 
    mail: this._mail
  };
};

/**
 * Sets the format of this ListUnsubscribeData.
 * @param {string} format The format of this ListUnsubscribeData.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ListUnsubscribeData.
 * @return {string} The format of this ListUnsubscribeData.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the headers of this ListUnsubscribeData.
 * @param {string} headers The headers of this ListUnsubscribeData.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.setHeaders = function(headers) {
  this._headers = headers;
  return this;
};

/**
 * Provides the headers of this ListUnsubscribeData.
 * @return {string} The headers of this ListUnsubscribeData.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.getHeaders = function() {
  return this._headers;
};

/**
 * Sets the recipient of this ListUnsubscribeData.
 * @param {string} recipient The recipient of this ListUnsubscribeData.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.setRecipient = function(recipient) {
  this._recipient = recipient;
  return this;
};

/**
 * Provides the recipient of this ListUnsubscribeData.
 * @return {string} The recipient of this ListUnsubscribeData.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.getRecipient = function() {
  return this._recipient;
};

/**
 * Sets the mail of this ListUnsubscribeData.
 * @param {Array.<string>} mail The mail of this ListUnsubscribeData.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.setMail = function(mail) {
  this._mail = mail;
  return this;
};

/**
 * Provides the mail of this ListUnsubscribeData.
 * @return {Array.<string>} The mail of this ListUnsubscribeData.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.getMail = function() {
  return this._mail;
};

/**
 * Loads the mail of this ListUnsubscribeData.
 * @return {Promise.<tutao.entity.tutanota.Mail>} Resolves to the loaded mail of this ListUnsubscribeData or an exception if the loading failed.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.loadMail = function() {
  return tutao.entity.tutanota.Mail.load(this._mail);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "25";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.ListUnsubscribeData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ListUnsubscribeData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
