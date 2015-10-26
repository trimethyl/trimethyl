# UIFactory.Select

I like iOS implementation of `<select>` in the browser; it just works.

I know, select on mobile are bad for UX, but sometimes there's no choice.

The implementation is different based on OS: on iOS, it's displayed on a `Label` with a `Picker` that appears from the bottom of the screen, or on a `Popover` on iPad. On Android, the `Picker` is implemented natively in this way.

### Types

Define the type of the Select with the `type` property.

#### Plain

The *all-we-know* Select, with various options.

You can define the values in two different formats:

* **Array of Primitive values** like `[ "Julie", "Sarah", "Valentine" ]`
* **Array of Literal objects with title/value** like `[ { title: "Julie", value: 1 }, ... ]`

To assign the values, you can set the initial property `values` or call after rendering `setValues(...)`.

To define an **initial value**, set the property `theValue`. When working with Literal objects, you must set `theValue` to the `value` property of literal, not to the object itself.

**Example with Array of Object title/value**

```xml
<Select top="60" module="T/uifactory" id="sel" left="20" right="20" backgroundColor="#ddd" borderRadius="6" theValue="1" />
```
```js
$.sel.setValues([
	{ title: '  Julie', value: 1 },
	{ title: '  Sarah', value: 2 },
	{ title: '  Valentine', value: 3 }
]);
```

![](http://f.cl.ly/items/1r0X0t2n463w0g1y3c0r/Image%202014-12-03%20at%208.55.33%20PM.png)

#### Date

With this type, you can set the `dateFormat` property to format the output date.

Set the initial date with the `theValue` property: it must be a valid javascript `Date` object.

![](http://cl.ly/image/1B271v0z1P3K/Image%202014-12-03%20at%209.09.38%20PM.png)