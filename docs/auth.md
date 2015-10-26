## Auth

## Authentication with a REST web server provided by local drivers

Local drivers available are:

* `std`: Standard (bypass) auth with email and password
* `facebook`: SSO with Facebook

The module works with a Alloy user model, so you must put in your `/app/models` directory, a file called `user.js`:

```js
exports.definition = {

	config : {
		adapter: {
			type: 'api',
			name: 'users'
		}
	},

};
```

To login in the API server, just call:

```js
Auth.login({
	driver: 'std',
	data: { /* data passed to the driver */ },
	success: function() {
		/* Open dashboard */
	},
	error: function(err) {
		if (err.code === 403) {
			/* Make something different */
		}
	}
});
```

Once you're logged, you can obtain current user model with `Auth.getUser()` or current user ID with `Auth.getUserID()`.

To just verify if the user is logged in, use `Auth.isLoggedIn()`.

Once you have logged in almost one time, login data is available offline, so you can login with previous credentials (and previous driver, obviously) by using `Auth.storedLogin()`.

```js
if (Auth.isStoredLoginAvailable()) {
   Auth.storedLogin({
      success: function() { /* ... */ },
      error: function(err) { /* ... */ }
   });
}
```

**Always check to `Auth.isStoredLoginAvailable()` before calling `Auth.storedLogin()`**

If you're offline, calling `Auth.storedLogin()` you will be automatically logged in with stored user model.