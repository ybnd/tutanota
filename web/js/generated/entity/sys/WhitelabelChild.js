"use strict";

tutao.provide('tutao.entity.sys.WhitelabelChild');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.WhitelabelChild = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._comment = null;
    this._comment_ = null;
    this._createdDate = null;
    this._deletedDate = null;
    this._mailAddress = null;
    this._customer = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.WhitelabelChild.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.WhitelabelChild.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._comment = data.comment;
  this._comment_ = null;
  this._createdDate = data.createdDate;
  this._deletedDate = data.deletedDate;
  this._mailAddress = data.mailAddress;
  this._customer = data.customer;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.WhitelabelChild.MODEL_VERSION = '26';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.WhitelabelChild.PATH = '/rest/sys/whitelabelchild';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.WhitelabelChild.ROOT_INSTANCE_ID = 'A3N5cwAE6Q';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.WhitelabelChild.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.WhitelabelChild.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.WhitelabelChild.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    comment: this._comment, 
    createdDate: this._createdDate, 
    deletedDate: this._deletedDate, 
    mailAddress: this._mailAddress, 
    customer: this._customer
  };
};

/**
 * Provides the id of this WhitelabelChild.
 * @return {Array.<string>} The id of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this WhitelabelChild.
 * @param {string} format The format of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this WhitelabelChild.
 * @return {string} The format of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerEncSessionKey of this WhitelabelChild.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this WhitelabelChild.
 * @return {string} The ownerEncSessionKey of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this WhitelabelChild.
 * @param {string} ownerGroup The ownerGroup of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this WhitelabelChild.
 * @return {string} The ownerGroup of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this WhitelabelChild.
 * @param {string} permissions The permissions of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this WhitelabelChild.
 * @return {string} The permissions of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the comment of this WhitelabelChild.
 * @param {string} comment The comment of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.setComment = function(comment) {
  var dataToEncrypt = comment;
  this._comment = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._comment_ = comment;
  return this;
};

/**
 * Provides the comment of this WhitelabelChild.
 * @return {string} The comment of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.getComment = function() {
  if (this._comment_ != null) {
    return this._comment_;
  }
  if (this._comment == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._comment);
    this._comment_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the createdDate of this WhitelabelChild.
 * @param {Date} createdDate The createdDate of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.setCreatedDate = function(createdDate) {
  this._createdDate = String(createdDate.getTime());
  return this;
};

/**
 * Provides the createdDate of this WhitelabelChild.
 * @return {Date} The createdDate of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.getCreatedDate = function() {
  if (isNaN(this._createdDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._createdDate);
  }
  return new Date(Number(this._createdDate));
};

/**
 * Sets the deletedDate of this WhitelabelChild.
 * @param {Date} deletedDate The deletedDate of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.setDeletedDate = function(deletedDate) {
  if (deletedDate == null) {
    this._deletedDate = null;
  } else {
    this._deletedDate = String(deletedDate.getTime());
  }
  return this;
};

/**
 * Provides the deletedDate of this WhitelabelChild.
 * @return {Date} The deletedDate of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.getDeletedDate = function() {
  if (this._deletedDate == null) {
    return null;
  }
  if (isNaN(this._deletedDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._deletedDate);
  }
  return new Date(Number(this._deletedDate));
};

/**
 * Sets the mailAddress of this WhitelabelChild.
 * @param {string} mailAddress The mailAddress of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this WhitelabelChild.
 * @return {string} The mailAddress of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the customer of this WhitelabelChild.
 * @param {string} customer The customer of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.setCustomer = function(customer) {
  this._customer = customer;
  return this;
};

/**
 * Provides the customer of this WhitelabelChild.
 * @return {string} The customer of this WhitelabelChild.
 */
tutao.entity.sys.WhitelabelChild.prototype.getCustomer = function() {
  return this._customer;
};

/**
 * Loads the customer of this WhitelabelChild.
 * @return {Promise.<tutao.entity.sys.Customer>} Resolves to the loaded customer of this WhitelabelChild or an exception if the loading failed.
 */
tutao.entity.sys.WhitelabelChild.prototype.loadCustomer = function() {
  return tutao.entity.sys.Customer.load(this._customer);
};

/**
 * Loads a WhitelabelChild from the server.
 * @param {Array.<string>} id The id of the WhitelabelChild.
 * @return {Promise.<tutao.entity.sys.WhitelabelChild>} Resolves to the WhitelabelChild or an exception if the loading failed.
 */
tutao.entity.sys.WhitelabelChild.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.WhitelabelChild, tutao.entity.sys.WhitelabelChild.PATH, id[1], id[0], {"v" : "26"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple WhitelabelChilds from the server.
 * @param {Array.<Array.<string>>} ids The ids of the WhitelabelChilds to load.
 * @return {Promise.<Array.<tutao.entity.sys.WhitelabelChild>>} Resolves to an array of WhitelabelChild or rejects with an exception if the loading failed.
 */
tutao.entity.sys.WhitelabelChild.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.WhitelabelChild, tutao.entity.sys.WhitelabelChild.PATH, ids, {"v": "26"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.WhitelabelChild.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "26";
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.WhitelabelChild.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this WhitelabelChild on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.WhitelabelChild.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.WhitelabelChild.PATH, this, {"v": "26"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of WhitelabelChilds loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.WhitelabelChild>>} Resolves to an array of WhitelabelChild or rejects with an exception if the loading failed.
 */
tutao.entity.sys.WhitelabelChild.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.WhitelabelChild, tutao.entity.sys.WhitelabelChild.PATH, listId, start, count, reverse, {"v": "26"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.WhitelabelChild.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.WhitelabelChild.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.WhitelabelChild.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
