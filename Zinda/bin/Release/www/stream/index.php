<html>
<head>
	<title>Streamer by Kaj Toet</title>
	<link rel="stylesheet" type="text/css" href="style.css?v17">
	<script>
	<?php
	function session_readonly(){
		if(version_compare(PHP_VERSION, '7.0.0') >= 0){
			session_start(array('read_and_close' => true));
		} else {
			$session_name = preg_replace('/[^\da-z]/i', '', $_COOKIE[session_name()]);
			$session_data = file_get_contents(session_save_path() . '/sess_' . $session_name);

			$return_data = array();
			$offset = 0;

			while($offset < strlen($session_data)){
				if(!strstr(substr($session_data, $offset), '|')){
					break;
				}

				$pos = strpos($session_data, '|', $offset);
				$num = $pos - $offset;
				$varname = substr($session_data, $offset, $num);
				$offset += $num + 1;
				$data = unserialize(substr($session_data, $offset));
				$return_data[$varname] = $data;
				$offset += strlen(serialize($data));
			}

			$_SESSION = $return_data;
		}
	}
	
	if (!ctype_alnum($_GET['sid'])) $_GET['sid'] = 0;
	$sessionId = $_GET['sid'];
	echo "var SESSION_ID = \"" . $sessionId . "\";";
	?>
	</script>
	<script src="jquery-3.2.1.min.js"></script>
	<script src="pcm-player.js?<?php echo rand(); ?>"></script>
	<script src="xaudio.js?<?php echo rand(); ?>"></script>
	<script src="audio-stream.js?<?php echo rand(); ?>"></script>
	<script src="stream.js?<?php echo rand(); ?>"></script>
	<head>
		<meta name="viewport" content="width=device-width, target-densitydpi=device-dpi, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	</head>
</head>
<body>
	<div id="fps"></div>
	<canvas id="canvas" width="800" height="400"></canvas>
</body>
</html>
