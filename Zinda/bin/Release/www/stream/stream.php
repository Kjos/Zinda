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
$interlace = $framestamp % 2;

while (true) {
	session_readonly();

	if (!isset($_SESSION['initialized'])) {
		http_response_code(501);
		die();
	}

	$keyframe = $_SESSION['frames'][$interlace * 2 + 1];
	$bframe = $_SESSION['frames'][$interlace * 2];
	$behind = $framestamp - max($keyframe->framestamp, $bframe->framestamp);
	if ($keyframe->framestamp > $framestamp || $behind > 2) {
		header('content-type: application/octet-stream');
		header('keyframe: ' . $keyframe->keyframe);
		header('framestamp: ' . $keyframe->framestamp);
		echo $keyframe->data;
		break;

	} else if ($bframe->framestamp > $framestamp) {
		header('content-type: application/octet-stream');
		header('keyframe: ' . $bframe->keyframe);
		header('framestamp: ' . $bframe->framestamp);
		echo $bframe->data;
		break;
	}
	usleep(1000000 / $_SESSION['fps']);
}

?>