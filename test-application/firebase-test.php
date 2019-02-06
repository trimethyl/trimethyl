<?php $url = 'https://fcm.googleapis.com/fcm/send';

	$fields = array (
		'to' => "ecrktQG_prA:APA91bH_hf1VjEcoDsNZTwpCb4NJk6ioG8B-sEdbFKHRGN7RGpjDTGEnzR_7e1Fw0Yucb7_tkqcSHD47s_xYIYdicLqgPDsYglZvAS_WodgvAp9xSHHlekUxwC_rzotKlxgBoXChSk1u",
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
		'Authorization: key=AAAAyBiz4Ws:APA91bEEDDtYHTT0KV-9Kj-ohybgsBfqY6As98gZrskPh0Bo4qbiIq_rX53U3xMunpuMVGQTHAt9-nINe2mhNxK8pNmIIFs97QvDVSzvxfvVrh44JJDRW8IoayKmezNx9_E62hJd1beF',
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