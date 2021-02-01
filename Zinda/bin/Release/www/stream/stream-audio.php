<?php

function parseInt($val) {
	if (!ctype_digit($val)) {
		http_response_code(503); 
		exit();
	} else {
		return intval($val);
	}
}

class Frame {
	public $keyframe;
	public $framestamp;
	public $data;
}

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

if (!ctype_alnum($_GET['sid'])) {
	http_response_code(504);
	die();
}
session_id($_GET['sid']);

$framestamp = parseInt($_GET['framestamp']);

while (true) {
	session_readonly();

	if (!isset($_SESSION['initialized'])) {
		http_response_code(501);
		die();
	}

	$frame = $_SESSION['audio-frames'][0];
	$diff = $frame->framestamp - $framestamp;
	if ($diff < -2) $diff = 1;
	if ($diff > 0) {
		header('content-type: application/octet-stream');
		header('framestamp: ' . $frame->framestamp);
		echo $frame->data;
		break;
	} 
	usleep(1000000 / $_SESSION['fps']);
}

?>