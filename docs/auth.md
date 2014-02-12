# Auth

Manage authentication in a simple way. Require a *model/user.js* to store current user.

All authentication methods require a driver that handle request. Available drivers are:

* Standard
* Facebook

## Configuration

```javascript
{
    "drivers": {
        "facebook": {
            "appId": "[YOURAPPID]",
            "permissions": "[PERMISSIONS_COMMA_SEPARATED]"
        },
        "std": {}
    }
}
```

## User model example (models/user.js)

```javascript
exports.definition = {

    config : {
        adapter: {
            type: 'api',
            name: 'users'
        }
    },

    extendModel: function(Model) {
        _.extend(Model.prototype, {

            getPicture: function(){
                return require('util').getFacebookAvatar(this.get('facebook_id'));
            },

            isFacebook: function(){
                return !!this.get('facebook_id');
            }

        });
        return Model;
    }

};
```

## Login for the first time

To use, you **have to*** load the driver you'll use.

```javascript
var Auth = require('auth');
var FacebookAuth = Auth.loadDriver('facebook');
var StdAuth = Auth.loadDriver('std');
```

To login with Facebook, simply call:

```javascript
FacebookAuth.login();
```

Otherwise, if you login in a standard way:

```javascript
var data = {
    email: $.email.value.toString(),
    password: $.password.value.toString()
};
/* Validate data */
StdAuth.login(data);
```

The module will fire *auth.success* or *auth.fail*, so you'll just handle it and redirect your flow; for example:

```javascript
Ti.App.addEventListener('auth.success', function(e){
    /* Open your logged view */
});

Ti.App.addEventListener('auth.logout', function(e){
    /* Close your logged view */
});

Ti.App.addEventListener('auth.fail', function(e){
    /* warns the user and other stuffs */*
    require('util').alertError(e.message);
});
```

## Automatic login

If you logged in a previous session, you'll have to login automatically without user prompt.

Do it like this:

```javascript
Auth.handleLogin();
```

The module has stored previously if the user is logged (driver-indipendent), so just call `handleLogin`.

If no user is stored on the device, the module fire a `app.login` event.

## Logout

Simply call `Auth.logout()` and a `auth.logout` event is fired.

## Get current user

Calling `Auth.user()` or `Auth.me()` expose current user model, for example:

```javascript
Ti.App.addEventListener('auth.success', function(){
    var me = require('auth').user();
    alert("Hello "+me.get('first_name'));
});
```