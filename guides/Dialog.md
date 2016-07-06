# Dialog

### Show dialogs with an alternative *dictionary-based* syntax.

A *Dialog Dictionary* object is in the following form:

```javascript
[
   { title: 'Yes', selected: true, callback: function(){ ... } },
   { title: 'Delete', destructive: true, callback: function(){ ... } },
   { title: 'Cancel', cancel: true }
]
```

The `title` property is required for each entry, the `callback` property is required except for the `cancel` entry.

All other properties depend on the method used.

#### Alert

```javascript
Dialog.alert('Hello!', 'The quick brown fox jumps over the lazy dog',
    function() { /* callback */ }, { /* other AlertDialog properties */ });
```

#### Confirm

```javascript
Dialog.confirm('Hello!', 'The quick brown fox jumps over the lazy..', [
   { title: "dog", selected: true, callback: function() { /* you win */ } },
   { title: "cat", callback: function() { /* what the f**k is wrong with you? */ } },
   { title: "giraffe", destructive: true, callback: function() { /* O_o */} },
]);
```

#### Option

```javascript
Dialog.option('The quick brown fox jumps over the lazy..', [
   { title: "dog", selected: true, callback: function() { /* you win */ } },
   { title: "cat", callback: function() { /* what the f**k is wrong with you? */ } },
   { title: "giraffe", destructive: true, callback: function() { /* O_o */} },
   { title: "Cancel", cancel: true }
]);
```

#### Prompt

```javascript
Dialog.prompt('Hello!', 'The quick brown fox jumps over the lazy..', [
   { title: "dog", selected: true, callback: function(e) { if (e.text == 'dog' ) {/* you win */} } },
   { title: "tapir", callback: function(e) { /* why would you say that? */ } },
   { title: "Cancel", cancel: true }
]);
```
