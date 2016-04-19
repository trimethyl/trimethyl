# Flow

### Manages the app windows flow.

The navigation is based essentialy on a Navigator. On iOS, the default `Ti.UI.iOS.NavigationWindow` is used; on Android, the interface of the navigator must be compatible with the `Ti.UI.iOS.NavigationWindow`: you can use the `Trimethyl.UIFactory.NavigationWindow`.

When you have instantiated a `NavigationWindow` on your controllers, you can call `Flow.startup` to assign the Navigator: for example, in your *index.xml*, the code could be something like:

```xml
<Alloy>
   <NavigationWindow module="T/uifactory" id="nav">
      <Window module="T/uifactory" id="win">
         /* ... */
      </window>
   </NavigationWindow>
</Alloy>
```
And, in your *index.js*:

```javascript
Flow.setNavigationController($.nav, true);
```

Once you've set a **Navigator**, you move between your **Alloy Controllers** with the `Flow.open(controller, args)` method:

```javascript
Flow.open("users_controller", { id: 2 });
```

It's advised to use always Alloy Controllers to permit Trimethyl to manage your memory: for example, on the Window's close event, a `Controller.off()` and `Controller.destroy()` is called.

If you've custom events that Titanium can't manage, add a method to your controller to release memory like a charm:

```javascript
exports.cleanup = function() {
   // largeBlob = null;
   // Ti.App.removeEventListener('controller_event', func);
};
```

Sometimes, you don't want that certain controllers are opened in the standard flow: could be for stange opening logics. 

You can obviously manage these situations by calling `Flow.openDirect(controller, args)`.

```javascript
Flow.openDirect("modal_window");
```

The Flow class will execute the `$.open()` function in your controller (if defined, otherwise, will call a `$.getView().open()`.

### Auto screen tracking + screen timing with Google Analytics

All `Flow.open*` calls are tracked with the Google Analytics SDK (**you must install the `analytics.google` module to use this feature**), tracking screen with `GA.trackScreen` and `GA.trackTiming` when window closes.

You can set the analytics key by:

Passing as 4th argument to `Flow.open()`, `Flow.openDirect()`:

```javascript
Flow.open('users_controller', { id: 2, }, { animated: true }, '/users');
```

If you don't set a key, the key is the controller name.

### Retrieve current Controller/NavigationWindow/Window

To obtain current vars, use:

* `Flow.getNavigationController()` or `Flow.nav()` to get current `NavigationWindow`
* `Flow.getCurrentWindow()` or `Flow.win()` to get opened `Window`
* `Flow.getCurrentController()` to get last opened controller

### Close the flow

Once you finished with your, just call:

```javascript
Flow.close();
```