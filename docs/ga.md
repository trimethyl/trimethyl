# GA

Proxy object for ** Google Analitycs module **.

## Requirements

`gittio install -g analytics.google`

## Configuration

```javascript
{
    "ua": "UA-00112233444"
}
```

## Usage

See https://github.com/MattTuttle/titanium-google-analytics for full methods.

```javascript
require('ga').trackEvent({
    label: 'Fefifo Event',
    value: 3
});
```

