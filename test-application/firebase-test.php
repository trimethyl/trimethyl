<?php $url = 'https://fcm.googleapis.com/fcm/send';

	$fields = array (
			'to' => "<DEVICE TOKEN>",
			// 'to' => "/topics/test",
			'notification' => array (
				"title" => "TiFirebaseMessaging",
				"body" => "Message received 📱😂",
				// "timestamp"=>date('Y-m-d G:i:s'),
			),
			'data' => array(
				"title" => "test",
				"test1" => "value1",
				"test2" => "value2",
				"test3" => "value3",
				"channelId" => "default"	// or a different channel
			)
	);

	$headers = array (
			'Authorization: key=<SERVER KEY>',
			'Content-Type: application/json'
	);

	$ch = curl_init ();
	curl_setopt ( $ch, CURLOPT_URL, $url );
	curl_setopt ( $ch, CURLOPT_POST, true );
	curl_setopt ( $ch, CURLOPT_HTTPHEADER, $headers );
	curl_setopt ( $ch, CURLOPT_RETURNTRANSFER, true );
	curl_setopt ( $ch, CURLOPT_POSTFIELDS, json_encode($fields));

	$result = curl_exec ( $ch );
	echo $result."\n";
	curl_close ( $ch );
?>