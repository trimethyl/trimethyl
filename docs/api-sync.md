# Api Sync

This is an Alloy Backbone sync for REST API.

To let a model use this sync, just set

```javascript
exports.definition = {
	config : {
		adapter: {
			type: 'api',
			name: 'your_model_name_as_plural' /* Example: users */
		}
	}
};
```

in your model file (*app/models/yourmodel.js*)

** Paradigm is REST, so no further explanations. **