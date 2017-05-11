/**
 * @module  payments
 * @author  Ani Sinanaj <ani.sinanaj@caffeinalab.com>
 */

/**
 * @property config
 */
exports.config = _.extend({

	sandbox: true,
	androidKey: "",
	iOSKey: ""

}, Alloy.CFG.T ? Alloy.CFG.T.payments : {});

var MODULE_NAME = 'payments';

var Q = require('T/ext/q');
var Util = require('T/util');

var InAppBilling = OS_ANDROID ? Util.requireOrNull('ti.inappbilling') : Util.requireOrNull('ti.storekit');
if(Ti.App.deployType !== 'production') Ti.API.info("Initialized Payments.Pay");

exports.paymentsInitialized = false;
exports.types = {
	subscription: OS_ANDROID ? InAppBilling.ITEM_TYPE_SUBSCRIPTION : "",
	inapp: OS_ANDROID ? InAppBilling.ITEM_TYPE_INAPP : ""
};

/**
 * Private
 */

function iOSSetup() {
	return Q.promise(function(resolve, reject) {
		InAppBilling.receiptVerificationSandbox = exports.config.sandbox || (Ti.App.deployType !== 'production');
		InAppBilling.receiptVerificationSharedSecret = exports.config.iOSKey;
		InAppBilling.bundleVersion = Ti.App.version;
		InAppBilling.bundleIdentifier = Ti.App.id;
		resolve();
	});
}

function androidSetup() {
	return Q.promise(function(resolve, reject) {
		InAppBilling.startSetup({
	        publicKey: exports.config.androidKey
	    });
	    InAppBilling.addEventListener("setupcomplete", function setupHandler(e) {
	    	InAppBilling.removeEventListener("setupcomplete",setupHandler);
	    	
	    	if (e.success) return resolve(e);
	    	else return reject(e);
	    });
	});
}

function subscribable() {
	return Q.promise(function(resolve, reject) {
		if (OS_ANDROID && !InAppBilling.subscriptionsSupported()) return reject();
		if (OS_IOS && !InAppBilling.canMakePayments) return reject();
		
		exports.paymentsInitialized = true;
		resolve();
	});
}

function verify(product) {
	return Q.promise(function(resolve, reject) {
		var valid = InAppBilling.validateReceipt();
		if (!valid || !InAppBilling.receipt || !InAppBilling.receiptProperties.purchases) return reject();

		var purchase = _.filter(InAppBilling.receiptProperties.purchases, function(purchase) {
			return purchase.productIdentifier === product;
		});

		if (!purchase || purchase.length == 0) return reject();
		return resolve(purchase[1]);
	});
}

function getPurchaseiOS(product) {
	return Q.promise(function(resolve, reject) {
		if(!InAppBilling.receiptExists || !InAppBilling.validateReceipt()) {
			InAppBilling.refreshReceipt({expired: 0, revoked: 0}, function() {
				return verify(product)
				.then(resolve)
				.catch(reject);
			});
		} else if(InAppBilling.receiptExists && InAppBilling.validateReceipt()) {
			return verify(product)
			.then(resolve)
			.catch(reject);
		}
	});
}

function getPurchaseAndroid(product) {
	return Q.promise(function(resolve, reject) {
		self.getProducts()
		.then(function(list) {
			resove(list.inventory.getPurchase(product));
		})
		.catch(reject);
	});
}

function purchaseAndroid(product, opt) {
	opt = opt || {};
	return Q.promise(function(resolve, reject) {
		InAppBilling.addEventListener('purchasecomplete', function purchaseHandler(e) {
			InAppBilling.removeEventListener('purchasecomplete', purchaseHandler);
			if (e.success && e.purchase)
				resolve(e);
			else
				reject(e);
		});

		InAppBilling.purchase({
	        productId: product,
	        type: exports.types[opt.type] || InAppBilling.ITEM_TYPE_INAPP, //InAppBilling.ITEM_TYPE_SUBSCRIPTION
	        developerPayload: opt.data
	    });
	});
}

function purchaseiOS(product, opt) {
	return Q.promise(function(resolve, reject) {
		InAppBilling.removeTransactionObserver();
		
		InAppBilling.addEventListener('transactionState', function purchaseHandler(e) {
			if (e.state != InAppBilling.TRANSACTION_STATE_PURCHASING && e.state != InAppBilling.TRANSACTION_STATE_RESTORED) {
				InAppBilling.removeEventListener('transactionState', purchaseHandler);
				return resolve(e);
			} else if(e.state === InAppBilling.TRANSACTION_STATE_FAILED) {
				return reject(e);
			}
		});

		InAppBilling.addEventListener('restoredCompletedTransactions', function restoreHandler(e) {
			if(!e.error && e.transactions) {
				InAppBilling.removeEventListener('transactionState', purchaseHandler);
				InAppBilling.removeEventListener('restoredCompletedTransactions', restoreHandler);
				InAppBilling.removeTransactionObserver();
				return resolve(e);
			} else {
				InAppBilling.purchase({
					product: product,
					applicationUsername: opt.data
				});
			}
		});
		
		setTimeout(function() {
			InAppBilling.addTransactionObserver();
			InAppBilling.restoreCompletedTransactions();
		}, 0);
	});
}

function restoreIOS() {
	return Q.promise(function(e) {
		InAppBilling.removeTransactionObserver();
		InAppBilling.addEventListener('transactionState', function restorePurchasesHandler() {
			if (e.state == InAppBilling.TRANSACTION_STATE_RESTORED) {
				InAppBilling.removeEventListener('transactionState', restorePurchasesHandler);
				InAppBilling.removeTransactionObserver();
				resolve(e);
			} else if(e.state === InAppBilling.TRANSACTION_STATE_FAILED) {
				reject(e);
			}
		});
		
		InAppBilling.addTransactionObserver();
		InAppBilling.restoreCompletedTransactions();
	});
}

/**
 * Listeners
 */



/**
 * Public
 */

exports.setup = function() {
	if (exports.paymentsInitialized) return Q.resolve();
	if (!InAppBilling) {
		Ti.API.warn(MODULE_NAME, "Required module for in-app billing not found");
		return Q.reject();
	}

	var setupQ = OS_IOS ? iOSSetup : androidSetup;
	return Q.promise(function(resolve, reject) {
		setupQ
		.then(subscribable)
		.then(resolve)
		.catch(error);
	});
};

exports.getProducts = function(products, subProducts) {
	if (!InAppBilling) {
		Ti.API.warn(MODULE_NAME, "Required module for in-app billing not found");
		return Q.reject();
	}

	return Q.promise(function(resolve, reject) {
		if(OS_ANDROID) {
			InAppBilling.queryInventory({
				moreItems: products || null,
				moreSubs: (subProducts || products) || null
			});
			InAppBilling.addEventListener("queryinventorycomplete", function getProductsHandler() {
				InAppBilling.removeEventListener("queryinventorycomplete", getProductsHandler);
				if (!e.success) return reject();
				resolve(e.inventory);
			});
		}
		else if(OS_IOS) {
			InAppBilling.requestProducts(products, function() {
				if (!e.success) return reject();
				resolve(e.products);
			});
		}
	});
};

exports.getProduct = function(product, subProduct) {
	if (!InAppBilling) {
		Ti.API.warn(MODULE_NAME, "Required module for in-app billing not found");
		return Q.reject();
	}

	return Q.promise(function(resolve, reject) {
		exports.getProducts([product], [subProduct])
		.then(function(list) {
			resolve(OS_IOS ? list[0] : list.getDetails(product));
		})
		.catch(reject);
	});
};

exports.getPurchase = function(forProduct) {
	if (!InAppBilling) {
		Ti.API.warn(MODULE_NAME, "Required module for in-app billing not found");
		return Q.reject();
	}

	if (OS_IOS) return getPurchaseiOS(forProduct);
	else if (OS_ANDROID) return getPurchaseAndroid(forProduct);
};

exports.purchase = function(product, opt) {
	if (!InAppBilling) {
		Ti.API.warn(MODULE_NAME, "Required module for in-app billing not found");
		return Q.reject();
	}

	if (OS_IOS) return purchaseiOS(product, opt);
	else if (OS_ANDROID) return purchaseAndroid(product, opt);
};

exports.restorePurchases = function() {
	if (!InAppBilling) {
		Ti.API.warn(MODULE_NAME, "Required module for in-app billing not found");
		return Q.reject();
	}

	if (OS_IOS) return restoreIOS();
	else exports.getProducts();
};