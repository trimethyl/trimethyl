# Cache

## Cache interface with different strategies

To change the default strategy, set it in your `config.json` as described in the [configuration section](https://github.com/CaffeinaLab/Trimethyl#configuration).

Available strategies are:

* **database**: implemented with a SQLite database.

Each strategy implements a standard interface with 4 defaults methods:

* `get(hash)`
* `set(hash, value, [ttl], [info])`
* `remove(hash)`
* `purge`

#### Set the values

```js
Cache.set('my_hash', '42', 60, { magicNumber: true });
```

#### Retrieve the values

```js
var objectA = Cache.get('my_hash');
```

The returned value is an object with these properties:

```js
{
   expire: [timestamp], // expiration expressed in timestamp, Number
   info: [info] //  informations stored along your data, Object
   value: [value] // the stored value, String
}
```

#### Remove a value

```js
Cache.remove('my_hash');
```

#### Remove all values

```js
Cache.purge()
```