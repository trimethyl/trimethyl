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
				Ti.API.log(user);
				return alert("FAIL");
			}

			alert("SUCCESS");
		},
		error: function(err) {
			Ti.API.error(err);
			alert("FAIL");
		}
	});
});

$.btnAuto.addEventListener('click', function() {
	Auth.autoLogin({
		success: function(user) {
			if (user.id != 1) {
				Ti.API.log(user);
				return alert("FAIL");
			}

			alert("SUCCESS");
		},
		error: function(err) {
			Ti.API.error(err);
			alert("FAIL");
		}
	});
});