<?php
// table snippet: snippetID, snippetName, snippetDescription, snippet
// table langSnippet: intermediary table that relates snippetIDs to langIDs
// using an intermediary allows for each snippet to be related to many languages

include_once "dbTools.php";

if ($_SERVER["REQUEST_METHOD"] == 'GET') {
	$pdo = buildPDO();

	if (isset($_GET['snippetID']) && isset($_GET['langID'])) {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("Both snippetID and langID are specified. Only one can be given");
	} else if (isset($_GET['snippetID'])) {
		if (trim($_GET['snippetID']) == '') {
			http_response_code(422);
			header("Content-type: text/plain; charset=utf-8");
			die("Empty snippetID");
		}

		$snippetID = $_GET['snippetID'];
		$stmt = $pdo->prepare("SELECT * FROM snippet WHERE snippetID=? ORDER BY snippetID;");
		$stmt->execute([$snippetID]);
		$snippets = $stmt->fetchAll(PDO::FETCH_ASSOC);

		if (count($snippets) <= 0) {
			http_response_code(404);
			header("Content-type: text/plain; charset=utf-8");
			die("No such snippet");
		}

		$snippets = buildLangList($pdo, $snippets);

		header("Content-type: application/json; charset=utf-8");
		echo json_encode($snippets[0]);
	} elseif (isset($_GET['langID'])) {
		if (trim($_GET['langID']) == '') {
			http_response_code(422);
			header("Content-type: text/plain; charset=utf-8");
			die("Empty langID");
		}

		$langID = $_GET['langID'];
		$stmt = $pdo->prepare("SELECT DISTINCT snippetID, snippetName, snippetDescription, snippet FROM snippet NATURAL JOIN langSnippet WHERE langID=? ORDER BY snippetID;");
		$stmt->execute([$langID]);
		$snippets = $stmt->fetchAll(PDO::FETCH_ASSOC);

		if (count($snippets) <= 0) {
			http_response_code(404);
			header("Content-type: text/plain; charset=utf-8");
			die("No snippets for the given langID");
		}

		$snippets = buildLangList($pdo, $snippets);

		header("Content-type: application/json; charset=utf-8");
		echo json_encode($snippets);
	} else {
		$stmt = $pdo->prepare("SELECT * FROM snippet ORDER BY snippetID;");
		$stmt->execute();
		$snippets = $stmt->fetchAll(PDO::FETCH_ASSOC);

		$snippets = buildLangList($pdo, $snippets);

		header("Content-type: application/json; charset=utf-8");
		echo json_encode($snippets);
	}
} elseif ($_SERVER["REQUEST_METHOD"] == 'POST') {
	$pdo = buildPDO();

	if (!isset($_POST['snippetName']) || trim($_POST['snippetName']) == '') {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("A snippet name is required");
	}
	$name = trim($_POST['snippetName']);

	$desc = '';
	if (isset($_POST['snippetDescription'])) {
		$desc = trim($_POST['snippetDescription']);
	}

	$snippet = '';
	if (isset($_POST['snippet'])) {
		$snippet = trim($_POST['snippet']);
	}

	$langID = NULL;
	if (isset($_POST['langID'])) {
		$langID = $_POST['langID'];
	}

	$stmt = $pdo->prepare("INSERT INTO snippet (snippetID, snippetName, snippetDescription, snippet) VALUES (NULL, ?, ?, ?);");
	$stmt->execute([$name, $desc, $snippet]);
	$snippetID = $pdo->lastInsertId();

	if (isset($langID)) {
		$stmt = $pdo->prepare("INSERT INTO langSnippet (snippetID, langID) VALUES (?, ?);");
		$stmt->execute([$snippetID, $langID]);
	}

	http_response_code(201);
	header("Content-type: application/json; charset=utf-8");
	echo $snippetID;
} elseif ($_SERVER["REQUEST_METHOD"] == 'PUT') {
	$pdo = buildPDO();

	// send request as url encoded form
	$_PUT = array();
	parse_str(file_get_contents("php://input"), $_PUT);

	if (!isset($_PUT['snippetID']) || trim($_PUT['snippetID']) == '') {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("snippetID is required");
	}
	$snippetID = trim($_PUT['snippetID']);

	$name = null;
	if (isset($_PUT['snippetName'])) {
		$name = trim($_PUT['snippetName']);
	}
	if (isset($name) && $name == '') {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("snippetName cannot be empty");
	}

	$desc = null;
	if (isset($_PUT['snippetDescription'])) {
		$desc = trim($_PUT['snippetDescription']);
	}

	$body = null;
	if (isset($_PUT['snippet'])) {
		$body = trim($_PUT['snippet']);
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
		$stmt = $pdo->prepare("SELECT * FROM langSnippet WHERE snippetID=? AND langID=?;");
		$stmt->execute([$snippetID, $langID]);
		if ($stmt->rowCount() > 0) {
			http_response_code(422);
			header("Content-type: text/plain; charset=utf-8");
			die("The given snippetID-langID connection already exists");
		}
	}


	if (isset($name)) {
		$stmt = $pdo->prepare("UPDATE snippet SET snippetName=? WHERE snippetID=?;");
		$stmt->execute([$name, $snippetID]);
	}
	if (isset($desc)) {
		$stmt = $pdo->prepare("UPDATE snippet SET snippetDescription=? WHERE snippetID=?;");
		$stmt->execute([$desc, $snippetID]);
	}
	if (isset($body)) {
		$stmt = $pdo->prepare("UPDATE snippet SET snippet=? WHERE snippetID=?;");
		$stmt->execute([$body, $snippetID]);
	}


	if (isset($langID)) {
		$stmt = $pdo->prepare("INSERT INTO langSnippet (snippetID, langID) VALUES (?, ?);");
		$stmt->execute([$snippetID, $langID]);
	}

	http_response_code(204);
} elseif ($_SERVER["REQUEST_METHOD"] == 'DELETE') {
	$pdo = buildPDO();

	// send request as url encoded form
	$_DELETE = array();
	parse_str(file_get_contents("php://input"), $_DELETE);

	// can delete either the snippet itself or an association with a lang
	if (!isset($_DELETE['snippetID']) || trim($_DELETE['snippetID'])== '') {
		http_response_code(422);
		header("Content-type: text/plain; charset=utf-8");
		die("snippetID is required");
	}
	$snippetID = trim($_DELETE['snippetID']);

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
		$stmt = $pdo->prepare("DELETE FROM langSnippet WHERE snippetID=? AND langID=?;");
		$stmt->execute([$snippetID, $langID]);
		$rows = $stmt->rowCount();
	} else {
		$stmt = $pdo->prepare("DELETE FROM snippet WHERE snippetID=?;");
		$stmt->execute([$snippetID]);
		$rows = $stmt->rowCount();
		if ($rows > 0) {
			$stmt = $pdo->prepare("DELETE FROM langSnippet WHERE snippetID=?;");
			$stmt->execute([$snippetID]);
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

function buildLangList($pdo, $snippets) {
	for ($j = 0; $j < count($snippets); $j++) {
		$snippetID = $snippets[$j]['snippetID'];

		$snippets[$j]['languages'] = array();
		$stmt = $pdo->prepare("SELECT langID, langName FROM langSnippet NATURAL JOIN language WHERE snippetID=? ORDER BY langID;");
		$stmt->execute([$snippetID]);
		$langList = $stmt->fetchAll(PDO::FETCH_ASSOC);
		for ($i = 0; $i < count($langList); $i++) {
			$snippets[$j]['languages'][$i] = $langList[$i];
		}
	}

	return $snippets;
}

?>
