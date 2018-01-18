"use strict";

tutao.provide('tutao.entity.tutanota.ContactFormLanguage');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormLanguage = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._code = null;
    this._footerHtml = null;
    this._headerHtml = null;
    this._helpHtml = null;
    this._pageTitle = null;
    this._statisticsFields = [];
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.ContactFormLanguage.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._code = data.code;
  this._footerHtml = data.footerHtml;
  this._headerHtml = data.headerHtml;
  this._helpHtml = data.helpHtml;
  this._pageTitle = data.pageTitle;
  this._statisticsFields = [];
  for (var i=0; i < data.statisticsFields.length; i++) {
    this._statisticsFields.push(new tutao.entity.tutanota.InputField(parent, data.statisticsFields[i]));
  }
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    code: this._code, 
    footerHtml: this._footerHtml, 
    headerHtml: this._headerHtml, 
    helpHtml: this._helpHtml, 
    pageTitle: this._pageTitle, 
    statisticsFields: tutao.entity.EntityHelper.aggregatesToJsonData(this._statisticsFields)
  };
};

/**
 * Sets the id of this ContactFormLanguage.
 * @param {string} id The id of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this ContactFormLanguage.
 * @return {string} The id of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the code of this ContactFormLanguage.
 * @param {string} code The code of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.setCode = function(code) {
  this._code = code;
  return this;
};

/**
 * Provides the code of this ContactFormLanguage.
 * @return {string} The code of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.getCode = function() {
  return this._code;
};

/**
 * Sets the footerHtml of this ContactFormLanguage.
 * @param {string} footerHtml The footerHtml of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.setFooterHtml = function(footerHtml) {
  this._footerHtml = footerHtml;
  return this;
};

/**
 * Provides the footerHtml of this ContactFormLanguage.
 * @return {string} The footerHtml of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.getFooterHtml = function() {
  return this._footerHtml;
};

/**
 * Sets the headerHtml of this ContactFormLanguage.
 * @param {string} headerHtml The headerHtml of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.setHeaderHtml = function(headerHtml) {
  this._headerHtml = headerHtml;
  return this;
};

/**
 * Provides the headerHtml of this ContactFormLanguage.
 * @return {string} The headerHtml of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.getHeaderHtml = function() {
  return this._headerHtml;
};

/**
 * Sets the helpHtml of this ContactFormLanguage.
 * @param {string} helpHtml The helpHtml of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.setHelpHtml = function(helpHtml) {
  this._helpHtml = helpHtml;
  return this;
};

/**
 * Provides the helpHtml of this ContactFormLanguage.
 * @return {string} The helpHtml of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.getHelpHtml = function() {
  return this._helpHtml;
};

/**
 * Sets the pageTitle of this ContactFormLanguage.
 * @param {string} pageTitle The pageTitle of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.setPageTitle = function(pageTitle) {
  this._pageTitle = pageTitle;
  return this;
};

/**
 * Provides the pageTitle of this ContactFormLanguage.
 * @return {string} The pageTitle of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.getPageTitle = function() {
  return this._pageTitle;
};

/**
 * Provides the statisticsFields of this ContactFormLanguage.
 * @return {Array.<tutao.entity.tutanota.InputField>} The statisticsFields of this ContactFormLanguage.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.getStatisticsFields = function() {
  return this._statisticsFields;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ContactFormLanguage.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
