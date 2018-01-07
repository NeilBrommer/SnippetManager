$(document).ready(function () {
	$("#snippetLink").click(function (e) {
		e.preventDefault();
		loadSnippets();
	});

	$("#editSnippetModal").on("shown.bs.modal", function (e) {
		$(".langSelect").val(selectList);
	});

	$("#addSnippetTab").on("shown.bs.tab", function (e) {
		$("#txtSnippetName").focus();
	});

	$("#btnSaveSnippet").click(saveSnippet);
});

function addSnippetLangs(snippetID, snippetName, langIDList) {
	if (langIDList != null) {
		for (var i = 0; i < langIDList.length; i++) {
			$.ajax({
				url: "snippet.php",
				type: "PUT",
				data: {snippetID: snippetID, langID: langIDList[i]},
				error: displayError
			});
		}
	}

	successAlert("Successfully Added snippet: " + snippetName, "snippet");
}

function loadSnippets() {
	$("#langLink").removeClass("active");
	$("#snippetLink").addClass("active");
	$("#resourceLink").removeClass("active");
	$("#mainList").empty();

	$.ajax({
		url: "snippet.php",
		type: "GET",
		success: function (result) { addSnippets(result) },
		error: function (result) { displayError(result) }
	});
}

function addSnippets(snippetList) {
	var mainList = $("#mainList");
	for (let snippet of snippetList) {
		addSnippet(snippet);
	}
}

function addSnippet(snippet) {
	$("<div>").attr({ "id": "snippet-" + snippet.snippetID }).appendTo(mainList);
	var code = $('<pre><code>').attr("id", "snippet-" + snippet.snippetID + "-body").text(snippet.snippet);
	buildCard("snippet", snippet.snippetID, snippet.snippetName, snippet.languages, snippet.snippetDescription, code);
}

function showSnippet(snippetID) {
	deselectNav();
	$("#mainList").empty();
	$("<div>").attr("id", "snippet-" + snippetID).appendTo($("#mainList"));

	$.ajax({
		url: "snippet.php?snippetID=" + snippetID,
		type: "GET",
		success: function (result) { addSnippet(result); },
		error: function (result) { displayError(result); }
	});
}

function initEditSnippet(snippetID) {
	$("#editSnippetID").val(snippetID);
	$("#txtEditSnippetName").val($("#snippet-" + snippetID + "-name").text());
	$("#txtEditSnippetDesc").val($("#snippet-" + snippetID + "-description").text());
	$("#txtEditSnippetBody").val($("#snippet-" + snippetID + "-body").text());

	buildLangSelect();
	selectList = $("#snippet-" + snippetID + "-card").data("langs");

	$("#editSnippetModal").modal('show');
}

function saveSnippet() {
	var changeName = $("#editSnippetNameChk").prop("checked");
	var changeLang = $("#editSnippetLangsChk").prop("checked");
	var changeDesc = $("#editSnippetDescChk").prop("checked");
	var changeBody = $("#editSnippetBodyChk").prop("checked");

	if (!changeName && !changeLang && !changeDesc && !changeBody)
		return;

	var snippetID = $("#editSnippetID").val();
	var snippetName = $("#txtEditSnippetName").val().trim();
	var data = { snippetID: snippetID };

	if (changeName && snippetName == "") {
		displayError({responseText: "Name cannot be empty"});
		return;
	}

	if (changeName)
		data['snippetName'] = snippetName;
	if (changeDesc)
		data['snippetDescription'] = $("#txtEditSnippetDesc").val().trim();
	if (changeBody)
		data['snippet'] = $("#txtEditSnippetBody").val().trim();

	$.ajax({
		url: "snippet.php",
		type: "PUT",
		data: data,
		success: function () { successAlert("Successfully saved snippet: " + snippetName, "snippet"); },
		error: displayError
	});


	if (changeLang) {
		var curLangsList = $("#snippet-" + snippetID + "-card").data("langs");
		var newLangsList = $("#selectEditSnippetLangs").val().map(function (item) {
			return parseInt(item, 10);
		});

		var langsToAdd = inANotInB(newLangsList, curLangsList);
		manageAssocLang("snippet", "PUT", snippetID, langsToAdd);

		var langsToDelete = inANotInB(curLangsList, newLangsList);
		manageAssocLang("snippet", "DELETE", snippetID, langsToDelete);
	}
}

function handleSnippetClicked(evt, snippetID) {
	evt.preventDefault();
	showSnippet(snippetID);
}
