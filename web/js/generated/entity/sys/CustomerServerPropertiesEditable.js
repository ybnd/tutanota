"use strict";

tutao.provide('tutao.entity.sys.CustomerServerPropertiesEditable');

/**
 * Provides a knockout observable mechanism for a CustomerServerProperties.
 * @param {tutao.entity.sys.CustomerServerProperties} customerserverproperties The actual CustomerServerProperties.
 * @constructor
 */
tutao.entity.sys.CustomerServerPropertiesEditable = function(customerserverproperties) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = customerserverproperties;
	this.requirePasswordUpdateAfterReset = ko.observable(customerserverproperties.getRequirePasswordUpdateAfterReset());
	this.whitelabelCode = ko.observable(customerserverproperties.getWhitelabelCode());
	this.emailSenderList = ko.observableArray();
	for (var i = 0; i < customerserverproperties.getEmailSenderList().length; i++) {
		this.emailSenderList.push(new tutao.entity.sys.EmailSenderListElementEditable(customerserverproperties.getEmailSenderList()[i]));
	}
	this.whitelabelRegistrationDomains = ko.observableArray();
	for (var i = 0; i < customerserverproperties.getWhitelabelRegistrationDomains().length; i++) {
		this.whitelabelRegistrationDomains.push(new tutao.entity.sys.StringWrapperEditable(customerserverproperties.getWhitelabelRegistrationDomains()[i]));
	}
	if (customerserverproperties.getWhitelistedDomains()) {
		this.whitelistedDomains = ko.observable(new tutao.entity.sys.DomainsRefEditable(customerserverproperties.getWhitelistedDomains()));
	} else {
	    this.whitelistedDomains = ko.observable(null);
	}

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.sys.CustomerServerPropertiesExtension) {
		tutao.entity.sys.CustomerServerPropertiesExtension(this);
	}
};

/**
 * Provides the actual CustomerServerProperties.
 * @return {tutao.entity.sys.CustomerServerProperties} The CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerPropertiesEditable.prototype.getCustomerServerProperties = function() {
	return this._entity;
};

/**
 * Updates the underlying CustomerServerProperties with the modified attributes.
 */
tutao.entity.sys.CustomerServerPropertiesEditable.prototype.update = function() {
	this._entity.setRequirePasswordUpdateAfterReset(this.requirePasswordUpdateAfterReset());
	this._entity.setWhitelabelCode(this.whitelabelCode());
	this._entity.getEmailSenderList().length = 0;
	for (var i = 0; i < this.emailSenderList().length; i++) {
		this.emailSenderList()[i].update();
		this._entity.getEmailSenderList().push(this.emailSenderList()[i].getEmailSenderListElement());
	}
	this._entity.getWhitelabelRegistrationDomains().length = 0;
	for (var i = 0; i < this.whitelabelRegistrationDomains().length; i++) {
		this.whitelabelRegistrationDomains()[i].update();
		this._entity.getWhitelabelRegistrationDomains().push(this.whitelabelRegistrationDomains()[i].getStringWrapper());
	}
		if (this.whitelistedDomains()) {
			this.whitelistedDomains().update();
			this._entity.setWhitelistedDomains(this.whitelistedDomains().getDomainsRef());
		} else {
			this._entity.setWhitelistedDomains(null);
		}
	this.lastUpdatedTimestamp(new Date().getTime());
};
