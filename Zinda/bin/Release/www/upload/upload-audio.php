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
	public $framestamp;
	public $data;
}

$frame = new Frame();
$frame->framestamp = parseInt($_GET['framestamp']);
$frame->data = file_get_contents('php://input');

if (!ctype_alnum($_GET['sid'])) {
	http_response_code(504);
	die();
}
session_id($_GET['sid']);
session_start();

$_SESSION['audio-frames'][0] = $frame;
?>