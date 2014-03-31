# Events

Is a proxy module for Titanium App-Event.

## Usage

```javascript
var E = require('events');

E.on('hello', function hello(e){ alert('Hello '+e.name); });
E.on('test', function(e){ alert('Test 1'); });
E.on('test', function(e){ alert('Test 2'); });

E.fire('hello', { name:'Fefifo' });
E.off('test'); // remove every event with 'test' key
E.off('hello', hello); // remove only 'hello' event with that closure (Classic Titanium style)
```

Every event fired is fully compatible with `Ti.App`, so:

```javascript
E.on('hello', function(){ /* ... */ });
Ti.App.addEventListener('hello', function(){ /*...*/ });
```

these two are the same, like thoose:

```javascript
E.fire('hello');
Ti.App.fireEvent('hello');
```
