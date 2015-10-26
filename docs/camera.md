# Camera

### Helper for Camera access.

If some error occurs, a dialog error is presented to the user.

##### Take a photo with the system UI

```javascript
Camera.takePhoto({
   /* arguments passed to Ti.Media.showCamera or Ti.Media.openPhotoGallery */
}, function(e) {
   // Media Blob is in `e.media`
});
```

##### Select a photo from system gallery

```javascript
Camera.selectPhoto({
   /* arguments passed to Ti.Media.showCamera or Ti.Media.openPhotoGallery */
}, function(e) {
   // Media Blob is in `e.media`
});
```

##### Display an option dialog to prompt the user to take a photo / select photo

```javascript
Camera.takePhoto({
   /* arguments passed to Ti.Media.showCamera or Ti.Media.openPhotoGallery */
}, function(e) {
   // Media Blob is in `e.media`
});
```