<html>
<head>
	<title>Uploader by Kaj Toet</title>
	<link rel="stylesheet" type="text/css" href="style.css?v15">
	<script>
	<?php
	if (!ctype_alnum($_GET['sid'])) die();
	session_id($_GET['sid']);
	session_start();
	$_SESSION['fps'] = 30;
	$_SESSION['width'] = 640;
	$_SESSION['height'] = 480;
	$_SESSION['jpegQuality'] = 50;
	$_SESSION['jpegQualityKeyframe'] = 90;
		
	echo "var JPEG_QUALITY = " . $_SESSION['jpegQuality'] . ";";
	echo "var JPEG_QUALITY_KEYFRAME = " . $_SESSION['jpegQuality'] . ";";
	echo "var FPS = " . $_SESSION['fps'] . ";";
	echo "var WIDTH = " . $_SESSION['width'] . ";";
	echo "var HEIGHT = " . $_SESSION['height'] . ";";
	echo "var SESSION_ID = \"" . $_GET['sid'] . "\";";
	echo "var IGNORE_DIFFERENCE = 0.02;";
	echo "var KEYFRAME_THRESHOLD_SUM = IGNORE_DIFFERENCE * 8;";
	echo "var BFRAME_THRESHOLD = 0.75;";
	?>
	</script>
	<script>// petitojpeg fix
	var define = {amd: undefined}
	</script>
	<script src="pttjpeg.js?<?php echo rand(); ?>"></script>
	<script src="camvas.js?<?php echo rand(); ?>"></script>
	<script src="xaudio.js?<?php echo rand(); ?>"></script>
	<script src="audio-upload.js?<?php echo rand(); ?>"></script>
	<script src="upload.js?<?php echo rand(); ?>"></script>
	<head>
		<meta name="viewport" content="width=device-width, target-densitydpi=device-dpi, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	</head>
</head>
<body>
	<div id="fps"></div>
	<div id="fps10"></div>
	<canvas></canvas>
    <!--[if !IE]><script>fixScale(document);</script><![endif]-->
</body>
</html>
