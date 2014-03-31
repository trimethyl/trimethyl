# Share

Useful methods for sharing across platforms.

Simple refactor of https://github.com/FokkeZB/UTiL/tree/master/share.

## Requirements

`gittio install -g dk.napp.social`

https://github.com/viezel/TiSocial.Framework

## Usage

```javascript
/* Share via Facebook */
require('share').facebook({
    text: 'Sharing is sexy!',
    image: 'http://lorempixel.com/640/480/city/',
    url: 'http://caffeinalab.com'
});

/* Share on Twitter */
require('share').twitter({
    text: 'CaffeinaLab',
    url: 'http://caffeinalab.com'
});

/* Send via mail */
require('share').mail({
    subject: "Hey, use Trimethyl!",
    text: "Visit https://github.com/CaffeinaLab/Trimethyl for informations :)"
}, function(){ alert("Mail sent!"); });
```
