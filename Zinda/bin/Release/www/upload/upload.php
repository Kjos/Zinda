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

$frame = new Frame();
$frame->keyframe = parseInt($_GET['keyframe']);
$frame->framestamp = parseInt($_GET['framestamp']);
$frame->data = file_get_contents('php://input');

$interlace = $frame->framestamp % 2;
$type = $interlace * 2 + $frame->keyframe;

if (!ctype_alnum($_GET['sid'])) {
	http_response_code(504);
	die();
}
session_id($_GET['sid']);
session_start();

$_SESSION['frames'][$type] = $frame;

if (!isset($_SESSION['initialized'])) {
	$frames = $_SESSION['frames'];
	$cnt = 0;
	for ($i = 0; $i < 4; $i++) {
		if ($_SESSION['frames'][$i]) $cnt++;
	}
	if ($cnt == 4) $_SESSION['initialized'] = true;
}
?>