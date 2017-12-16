<?php
// table language: langID, langName, langDescription
// table langLang: langID, associatedLang
include_once "dbTools.php";

if ($_SERVER["REQUEST_METHOD"] == 'GET') {
	$pdo = buildPDO();

	if (isset(($_GET['langID'])) && isset($_GET['associatedLang'])) {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("Both langID and associatedLang are specified");
	}

	if (isset($_GET['langID'])) {
		$id = $_GET['langID'];
		$stmt = $pdo->prepare("SELECT * FROM language WHERE langID=?;");
		$stmt->execute([$id]);
		$lang = $stmt->fetchAll(PDO::FETCH_ASSOC);

		if (count($lang) <= 0) {
			http_response_code(404);
			header("Content-type: text/plain; charset=utf-8");
			die("No such language");
		}

		$lang = buildLangList($pdo, $lang);
		$lang = buildSnippetList($pdo, $lang);
		$lang = buildResourceList($pdo, $lang);

		header("Content-type: application/json; charset=utf-8");
		echo json_encode($lang[0]);
	} elseif (isset($_GET['associatedLang'])) {
		$assoc = $_GET['associatedLang'];
		if ($assoc == '') {
			header("Content-type: text/plain; charset=utf-8");
			die("associatedLang is given, but empty");
		}

		$stmt = $pdo->prepare("SELECT langID, langName, langDescription FROM language NATURAL JOIN langLang Where associatedLang=?;");
		$stmt->execute([$assoc]);
		$langList = $stmt->fetchAll(PDO::FETCH_ASSOC);

		$langList = buildLangList($pdo, $langList);
		$langList = buildSnippetList($pdo, $langList);
		$langList = buildResourceList($pdo, $langList);

		header("Content-type: application/json; charset=utf-8");
		echo json_encode($langList);
	} else {
		$stmt = $pdo->prepare("SELECT * FROM language ORDER BY langID;");
		$stmt->execute();
		$langList = $stmt->fetchAll(PDO::FETCH_ASSOC);

		$langList = buildLangList($pdo, $langList);
		$langList = buildSnippetList($pdo, $langList);
		$langList = buildResourceList($pdo, $langList);

		header("Content-type: application/json; charset=utf-8");
		echo json_encode($langList);
	}
} elseif ($_SERVER["REQUEST_METHOD"] == 'POST') {
	if (!isset($_POST['langName']) || trim($_POST['langName']) == '') {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("A name is required");
	}
	$name = trim($_POST['langName']);

	$pdo = buildPDO();
	$stmt = $pdo->prepare("SELECT * FROM language WHERE langName=?;");
	$stmt->execute([$name]);
	if ($stmt->rowCount() > 0) {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("A language with the given name already exists");
	}

	$desc = '';
	if (isset($_POST['langDescription'])) {
		$desc = trim($_POST['langDescription']);
	}

	$assoc = null;
	if (isset($_POST['associatedLang'])) {
		$assoc = trim($_POST['associatedLang']);
		if ($assoc == '') {
			http_response_code(422);
			header("Content-type: text/plain; charset=utf-8");
			die("Associated language is given, but empty");
		}
	}

	$stmt = $pdo->prepare("INSERT INTO language VALUES (NULL, ?, ?);");
	$stmt->execute([$name, $desc]);
	$newID = $pdo->lastInsertId();

	if (isset($assoc)) {
		$stmt = $pdo->prepare("INSERT INTO langLang VALUES (?, ?);");
		$stmt->execute([$newID, $assoc]);
		$stmt->execute([$assoc, $newID]); // make it two way
	}

	http_response_code(201);
	header("Content-type: text/plain; charset=utf-8");
	echo $newID;
} elseif ($_SERVER["REQUEST_METHOD"] == 'PUT') {
	$pdo = buildPDO();

	// send request as url encoded form
	$_PUT = array();
	parse_str(file_get_contents("php://input"), $_PUT);

	if (!isset($_PUT['langID']) || trim($_PUT['langID']) === '') {
		http_response_code(422);
		die("A langID is required");
	}
	$id = trim($_PUT['langID']);

	$name = null;
	if (isset($_PUT['langName']) && trim($_PUT['langName']) != '') {
		$name = trim($_PUT['langName']);
	}

	$pdo = buildPDO();
	$stmt = $pdo->prepare("SELECT * FROM language WHERE langName=?;");
	$stmt->execute([$name]);
	if ($stmt->rowCount() > 0) {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("A language with the given name already exists");
	}

	$desc = null;
	if (isset($_PUT['langDescription'])) {
		$desc = trim($_PUT['langDescription']);
	}

	$assoc = null;
	if (isset($_PUT['associatedLang'])) {
		$assoc = trim($_PUT['associatedLang']);
		if ($assoc == '') {
			http_response_code(422);
			header("Content-type: text/plain; charset=utf-8");
			die("Associated language is given, but empty");
		}
	}

	if (isset($name) && isset($desc)) {
		$stmt = $pdo->prepare("UPDATE language SET langName=?, langDescription=? WHERE langID=?;");
		$stmt->execute([$name, $desc, $id]);
	} elseif (isset($name)) {
		$stmt = $pdo->prepare("UPDATE language SET langName=? WHERE langID=?;");
		$stmt->execute([$name, $id]);
	} elseif (isset($desc)) {
		$stmt = $pdo->prepare("UPDATE language SET langDescription=? WHERE langID=?;");
		$stmt->execute([$desc, $id]);
	} elseif (!isset($assoc)) {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("Nothing given to update");
	}

	if (isset($assoc)) {
		$stmt = $pdo->prepare("Select * FROM langLang WHERE langID=? AND associatedLang=?;");
		$stmt->execute([$id, $assoc]);

		if ($stmt->rowCount() > 0) {
			http_response_code(422);
			header("Content-type: text/plain; charset=utf-8");
			die("The given langID-langID connection already exists");
		}

		$stmt = $pdo->prepare("INSERT INTO langLang VALUES (?, ?);");
		$stmt->execute([$id, $assoc]);
		$stmt->execute([$assoc, $id]); // make it two way
	}

	http_response_code(200);
} elseif ($_SERVER["REQUEST_METHOD"] == 'DELETE') {
	// send request as url encoded form
	$_DELETE = array();
	parse_str(file_get_contents("php://input"), $_DELETE);

	if (!isset($_DELETE['langID']) || trim($_DELETE['langID']) == '') {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("A langID is required");
	}
	$id = trim($_DELETE['langID']);

	$pdo = buildPDO();

	if (isset($_DELETE['associatedLang'])) {
		$assoc = trim($_DELETE['associatedLang']);
		if ($assoc == '') {
			http_response_code(422);
			header("Content-type: text/plain; charset=utf-8");
			die("Associated language is given, but empty");
		}

		$stmt = $pdo->prepare("DELETE FROM langLang WHERE langID=? AND associatedLang=?;");
		$stmt->execute([$id, $assoc]);
		$stmt->execute([$assoc, $id]);

		if ($stmt->rowCount() == 0) {
			http_response_code(404);
			header("Content-type: text/plain; charset=utf-8");
			die("No such item");
		}
	} else {
		$stmt = $pdo->prepare("DELETE FROM language WHERE langID=?;");
		$stmt->execute([$id]);

		if ($stmt->rowCount() == 0) {
			http_response_code(404);
			header("Content-type: text/plain; charset=utf-8");
			die("No such item");
		}

		$stmt = $pdo->prepare("DELETE FROM langSnippet WHERE langID=?;");
		$stmt->execute([$id]);
		$stmt = $pdo->prepare("DELETE FROM langResource WHERE langID=?;");
		$stmt->execute([$id]);
	}

	http_response_code(204);
} elseif ($_SERVER["REQUEST_METHOD"] == 'OPTIONS') {
	header("Content-type: text/plain; charset=utf-8");
	echo "Allow: GET,POST,PUT,DELETE";
} else {
	http_response_code(405);
}

function buildLangList($pdo, $langList)
{
	for ($i = 0; $i < count($langList); $i++) {
		$id = $langList[$i]['langID'];

		$langList[$i]['languages'] = array();
		$stmt = $pdo->prepare("SELECT langID, langName FROM langLang NATURAL JOIN language WHERE associatedLang=?");
		$stmt->execute([$id]);
		$newList = $stmt->fetchAll(PDO::FETCH_ASSOC);
		for ($j = 0; $j < count($newList); $j++) {
			$langList[$i]['languages'][$j] = $newList[$j];
		}
	}

	return $langList;
}

function buildSnippetList($pdo, $langList)
{
	for ($j = 0; $j < count($langList); $j++) {
		$id = $langList[$j]['langID'];

		$langList[$j]['snippets'] = array();
		$stmt = $pdo->prepare("SELECT snippetID, snippetName FROM langSnippet NATURAL JOIN snippet WHERE langID=?;");
		$stmt->execute([$id]);
		$snippetList = $stmt->fetchAll(PDO::FETCH_ASSOC);
		for ($i = 0; $i < count($snippetList); $i++) {
			$langList[$j]['snippets'][$i] = $snippetList[$i];
		}
	}

	return $langList;
}

function buildResourceList($pdo, $langList)
{
	for ($j = 0; $j < count($langList); $j++) {
		$id = $langList[$j]['langID'];

		$langList[$j]['resources'] = array();
		$stmt = $pdo->prepare("SELECT resourceID, resourceName FROM langResource NATURAL JOIN resource WHERE langID=?;");
		$stmt->execute([$id]);
		$resourceList = $stmt->fetchAll(PDO::FETCH_ASSOC);
		for ($i = 0; $i < count($resourceList); $i++) {
			$langList[$j]['resources'][$i] = $resourceList[$i];
		}
	}

	return $langList;
}
