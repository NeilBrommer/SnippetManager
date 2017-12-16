<?php
// resourceID, resourceName, resourceDescription, resourceLink
// intermediary table that relates resourceIDs to langIDs
// using an intermediary allows for each snippet to be related to many languages

include_once "dbTools.php";

if ($_SERVER["REQUEST_METHOD"] == 'GET') {
	$pdo = buildPDO();

	if (isset($_GET['resourseID']) && isset($_GET['langID'])) {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("Both resourceID and langID are specified. Only one can be given");
	} else if (isset($_GET['resourceID'])) {
		if (trim($_GET['resourceID']) == '') {
			http_response_code(422);
			header("Content-type: text/plain; charset=utf-8");
			die("Empty resourceID");
		}

		$resourceID = $_GET['resourceID'];
		$stmt = $pdo->prepare("SELECT * FROM resource WHERE resourceID=?;");
		$stmt->execute([$resourceID]);
		$resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

		if (count($resources) <= 0) {
			http_response_code(404);
			header("Content-type: text/plain; charset=utf-8");
			die("No such resource");
		}

		$resources = buildLangList($pdo, $resources);

		header("Content-type: application/json; charset=utf-8");
		echo json_encode($resources[0]);
	} elseif (isset($_GET['langID'])) {
		if (trim($_GET['langID']) == '') {
			http_response_code(422);
			header("Content-type: text/plain; charset=utf-8");
			die("Empty langID");
		}

		$langID = $_GET['langID'];
		$stmt = $pdo->prepare("SELECT DISTINCT resourceID, resourceName, resourceDescription, resourceLink FROM resource NATURAL JOIN langResource WHERE langID=? ORDER BY resourceID;");
		$stmt->execute([$langID]);
		$resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

		$resources = buildLangList($pdo, $resources);

		header("Content-type: application/json; charset=utf-8");
		echo json_encode($resources);
	} else {
		$stmt = $pdo->prepare("SELECT * FROM resource ORDER BY resourceID;");
		$stmt->execute();
		$resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

		$resources = buildLangList($pdo, $resources);

		header("Content-type: application/json; charset=utf-8");
		echo json_encode($resources);
	}
} elseif ($_SERVER["REQUEST_METHOD"] == 'POST') {
	$pdo = buildPDO();

	if (!isset($_POST['resourceName']) || trim($_POST['resourceName']) == '') {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("A resourceName is required");
	}
	$name = $_POST['resourceName'];

	$desc = '';
	if (isset($_POST['resourceDescription'])) {
		$desc = trim($_POST['resourceDescription']);
	}

	$link = '';
	if (isset($_POST['resourceLink'])) {
		$link = trim($_POST['resourceLink']);
	}

	$langID = NULL;
	if (isset($_POST['langID'])) {
		$langID = $_POST['langID'];
	}

	$stmt = $pdo->prepare("INSERT INTO resource (resourceID, resourceName, resourceDescription, resourceLink) VALUES (NULL, ?, ?, ?);");
	$stmt->execute([$name, $desc, $link]);
	$resourceID = $pdo->lastInsertId();

	if (isset($langID)) {
		$stmt = $pdo->prepare("INSERT INTO langResource (resourceID, langID) VALUES (?, ?);");
		$stmt->execute([$resourceID, $langID]);
	}

	http_response_code(201);
	header("Content-type: text/plain; charset=utf-8");
	echo $resourceID;
} elseif ($_SERVER["REQUEST_METHOD"] == 'PUT') {
	$pdo = buildPDO();

	// send request as url encoded form
	$_PUT = array();
	parse_str(file_get_contents("php://input"), $_PUT);

	if (!isset($_PUT['resourceID']) && trim($_PUT['resourceID']) == '') {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("resourceID is required");
	}
	$resourceID = trim($_PUT['resourceID']);

	$name = null;
	if (isset($_PUT['resourceName'])) {
		$name = trim($_PUT['resourceName']);
	}

	$desc = null;
	if (isset($_PUT['resourceDescription'])) {
		$desc = trim($_PUT['resourceDescription']);
	}

	$link = null;
	if (isset($_PUT['resourceLink'])) {
		$link = trim($_PUT['resourceLink']);
	}

	$langID = null;
	if (isset($_PUT['langID'])) {
		$langID = trim($_PUT['langID']);
	}
	if (isset($langID) && $langID == '') {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("langID is empty");
	}
	if (isset($langID)) {
		$stmt = $pdo->prepare("SELECT * FROM langResource WHERE resourceID=? AND langID=?;");
		$stmt->execute([$resourceID, $langID]);
		if ($stmt->rowCount() > 0) {
			http_response_code(422);
			header("Content-type: text/plain; charset=utf-8");
			die("The given resourceID-langID connection already exists");
		}
	}


	if (isset($name)) {
		$stmt = $pdo->prepare("UPDATE resource SET resourceName=? WHERE resourceID=?;");
		$stmt->execute([$name, $resourceID]);
	}
	if (isset($desc)) {
		$stmt = $pdo->prepare("UPDATE resource SET resourceDescription=? WHERE resourceID=?;");
		$stmt->execute([$desc, $resourceID]);
	}
	if (isset($link)) {
		$stmt = $pdo->prepare("UPDATE resource SET resourceLink=? WHERE resourceID=?;");
		$stmt->execute([$link, $resourceID]);
	}


	if (isset($langID)) {
		$stmt = $pdo->prepare("INSERT INTO langResource (resourceID, langID) VALUES (?, ?);");
		$stmt->execute([$resourceID, $langID]);
	}

	http_response_code(204);
} elseif ($_SERVER["REQUEST_METHOD"] == 'DELETE') {
	$pdo = buildPDO();

	// send request as url encoded form
	$_DELETE = array();
	parse_str(file_get_contents("php://input"), $_DELETE);

	// can delete either the snippet itself or an association with a lang
	if (!isset($_DELETE['resourceID']) || trim($_DELETE['resourceID'])== '') {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("snippetID is required");
	}
	$resourceID = trim($_DELETE['resourceID']);

	$langID = null;
	if (isset($_DELETE['langID'])) {
		$langID = trim($_DELETE['langID']);
	}
	if (isset($langID) && $langID == '') {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("langId is given, but empty");
	}

	$rows = null;
	if (isset($langID)) {
		$stmt = $pdo->prepare("DELETE FROM langResource WHERE resourceID=? AND langID=?;");
		$stmt->execute([$resourceID, $langID]);
		$rows = $stmt->rowCount();
	} else {
		$stmt = $pdo->prepare("DELETE FROM resource WHERE resourceID=?;");
		$stmt->execute([$resourceID]);
		$rows = $stmt->rowCount();
		if ($rows > 0) {
			$stmt = $pdo->prepare("DELETE FROM langResource WHERE resourceID=?;");
			$stmt->execute([$resourceID]);
		}
	}

	if ($rows == 0) {
		http_response_code(404);
		header("Content-type: text/plain; charset=utf-8");
		die("No such item");
	}

	http_response_code(204);
} else if ($_SERVER["REQUEST_METHOD"] == 'OPTIONS') {
	header("Content-type: text/plain; charset=utf-8");
	echo "Allow: GET,POST,PUT,DELETE";
} else {
	http_response_code(405);
}

function buildLangList($pdo, $resources) {
	for ($j = 0; $j < count($resources); $j++) {
		$resourceID = $resources[$j]['resourceID'];

		$resources[$j]['languages'] = array();
		$stmt = $pdo->prepare("SELECT langID, langName FROM langResource NATURAL JOIN language WHERE resourceID=? ORDER BY langID;");
		$stmt->execute([$resourceID]);
		$langList = $stmt->fetchAll(PDO::FETCH_ASSOC);
		for ($i = 0; $i < count($langList); $i++) {
			$resources[$j]['languages'][$i] = $langList[$i];
		}
	}

	return $resources;
}
?>
