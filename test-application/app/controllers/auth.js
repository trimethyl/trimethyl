var HTTP = T('http');
var Auth = T('auth');

$.btn.addEventListener('click', function() {
	Auth.login({
		driver: 'std',
		remember: true,
		data: {
			email: 'flavio.destefano',
			password: 'xxxxxxx'
		},
		success: function(user) {
			if (user.id != 1) {
				alert("FAIL");
			}
		},
		error: function(err) {
			Ti.API.error(err);
			alert("FAIL");
		}
	});
});

$.btnAuto.addEventListener('click', function() {
	Auth.autoLogin({
		success: function(e) {
			Ti.API.log(e);
		},
		error: function(err) {
			Ti.API.error(err);
		}
	});
});