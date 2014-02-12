# Flow

Manage your flow and forget closing your controller.

## Usage

```javascript
require('flow').open('controller_one');
require('flow').open('controller_two', { a:1, b:2 }); // this close "controller_one"
require('flow').back(); // close "controller_two" and open "controller_one"

require('flow').open('controller_three', { /*args*/ }, true); // this doesn't close previous
```

## Other methods

**reload()** reload current controller

**back()** back to previous controller

**current()** get current controller 

**closeCurrent()** close current controller

