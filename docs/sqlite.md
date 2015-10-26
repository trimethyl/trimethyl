# SQLite

### JavaScript SQLite abstraction layer.

`Ti.Database` is awesome, but sometimes you just want the values.

##### Instantiate

```js
var db = new SQLite('app');
```

##### Get a single value

```js
var value = db.value("SELECT id FROM users WHERE username = ?", "caffeina");
Ti.API.debug(value); // 1
```

##### Get an object (`Object`)

```js
var user = db.single("SELECT * FROM users WHERE name = ?", "caffeina");
Ti.API.debug(user.name); // "Caffeina"
```

##### Get a list (`Array`)

```js
var usersID = db.list("SELECT id FROM users");
Ti.API.debug(usersID); // [ 1, 2, 3, ... ]
```

##### Get a list of rows (`Array of Object`)

```js
var users = db.all("SELECT * FROM users");
Ti.API.debug(users); // [ { id: 1, username: "Caffeina" }, { ... }, ... ]
```

##### Execute a query

```js
var result = db.execute("UPDATE users SET id = ? WHERE name = ?", 42, "caffeina");
```