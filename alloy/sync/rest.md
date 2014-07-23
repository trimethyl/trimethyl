# API REST in JSON

## General Rules

* Model names must be in the plural form
* **---ALL---** responses must be in *json* form, containing `Content-Type: application/json`

HTTP codes are very important, so please:

* `2XX` for success responses
* `3XX` for success redirected responses
* `4XX` for logical app errors
* `5XX` for critical app errors

## Optimization rules

* Use GZIP for responses


### COLLECTION

#### Read

`GET /users`

```
{
	data: [
		{
			id: 1,
			name: 'Flavio'
		},
		{
			id: 2,
			name: 'Federico'
		}
	]
}
```

#### Read with pagination

`GET /users?page=2&limit=25`

```
{
	data: [
		...
	],
	pagination: {
		page: 3,
		limit: 25,
		count: 1387,
		prev: "/users?limit=25&page=4"
		next: "/users?limit=25&page=2"
	}
}
```

#### Read with filters

`GET /users?friends=true`

```
{
	friends: true,
	data: [
		...
	]
}
```


### MODEL

#### Create

`POST /users/:id first_name=Flavio last_name="De Stefano" sex=m`

```
{
	id: 33
}
```

#### Read

`GET /users/:id`

```
{
	id: 1,
	first_name: 'Flavio',
	last_name: 'De Stefano'
	age: 22,
	job: 'Developer',
	sex: 'm',
	works: [
		'Caffeina'
	]
}
```

#### Read with fields

`GET /users/:id?fields=first_name,last_name`

```
{
	id: 1,
	first_name: 'Flavio',
	last_name: 'De Stefano'
}
```

#### Update

`PUT /users/:id first_name=Flavio`

```
{
	id: 33
}
```

#### Delete

`DELETE /users/:id`

```
{
	success: true
}
```

### ERRORS

HTTP Code must be >=400 && <=505

```
{
	error: {
		message: "Ops, this is a human error!",
		type: "UncaughtException",
		code: 3
	}
}
```

### CACHING ON MOBILE APPS

You can pass the default HTTP `Expires` header

```
Expires: 30-Oct-2015 19:00:00
```

Or, better, pass the custom header `X-Cache-Ttl`, that specify the number of **seconds** for that resource.

```
X-Cache-Ttl: 3600
```



