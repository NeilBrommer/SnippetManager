$(document).ready(function () {
	$("#langLink").click(function (e) {
		e.preventDefault();
		loadLangs();
	});

	$("#editLangModal").on("shown.bs.modal", function (e) {
		$(".langSelect").val(selectList);
	});

	$("#addLangTab").on("shown.bs.tab", function (e) {
		$("#txtLangName").focus();
	});

	$("#btnSaveLang").click(saveLang);
});

function addLangLangs(langID, langName, langIDList) {
	if (langIDList != null) {
		for (var i = 0; i < langIDList.length; i++) {
			$.ajax({
				url: "lang.php",
				type: "PUT",
				data: {langID: langID, associatedLang: langIDList[i]},
				error: displayError
			});
		}
	}

	successAlert("Successfully Added language: " + langName, "lang");
}

function loadLangs() {
	$("#langLink").addClass("active");
	$("#snippetLink").removeClass("active");
	$("#resourceLink").removeClass("active");
	$("#mainList").empty();

	$.ajax({
		url: "lang.php",
		type: "GET",
		success: function (result) { addLangs(result) },
		error: function (result) { displayError(result) }
	});
}

function addLangs(langList) {
	var mainList = $("#mainList");
	for (var i = 0; i < langList.length; i++) {
		$("<div>").attr({ "id": "lang-" + langList[i].langID }).appendTo(mainList);
		$.ajax({
			url: "lang.php?langID=" + langList[i].langID,
			type: "GET",
			success: function (result) { addLang(result) },
			error: function (result) { displayError(result) }
		});
	}
}

function addLang(lang) {
	var body = $('<div>');

	// build list of snippet links
	if (lang.snippets.length != 0) {
		$('<hr>').appendTo(body);
		$('<span>').addClass("card-text text-muted mr-3").text("Snippets:").appendTo(body);

		var snippets = lang.snippets;
		for (var i = 0; i < snippets.length; i++) {
			var cur = snippets[i];
			var snippetID = cur.snippetID;
			$("<a>").attr({
				"id": "snippet-" + snippetID,
				"class": "card-link",
				"href": "#",
				"data-snippetID": snippetID,
				"onClick": "handleSnippetClicked(event, " + snippetID + ")"
			}).text(cur.snippetName).appendTo(body);
		}
	}

	//build list of resource links
	if (lang.resources.length != 0) {
		$('<hr>').appendTo(body);
		$('<span>').addClass("card-text text-muted mr-3").text("Resources:").appendTo(body);

		var resources = lang.resources;
		for (var i = 0; i < resources.length; i++) {
			var cur = resources[i];
			var resourceID = cur.resourceID;
			$("<a>").attr({
				"id": "resource-" + resourceID,
				"class": "card-link",
				"href": "#",
				"data-resourceID": resourceID,
				"onclick": "handleResourceClicked(event, " + resourceID + ")"
			}).text(cur.resourceName).appendTo(body);
		}
	}

	buildCard("lang", lang.langID, lang.langName, lang.languages, lang.langDescription, body);
}

function showLang(langID) {
	deselectNav();
	$("#mainList").empty();

	$("<div>").attr("id", "lang-" + langID).appendTo($("#mainList"));
	$.ajax({
		url: "lang.php?langID=" + langID,
		type: "GET",
		success: function (result) { addLang(result) },
		error: function (result) { displayError(result) }
	});
}

function initEditLang(langID) {
	$("#editLangID").val(langID);
	$("#txtEditLangName").val($("#lang-" + langID + "-name").text());
	$("#txtEditLangDesc").val($("#lang-" + langID + "-description").text());

	buildLangSelect();
	selectList = $("#lang-" + langID + "-card").data("langs");

	$("#editLangModal").modal('show');
}

function saveLang() {
	var changeName = $("#editLangNameChk").prop("checked");
	var changeLang = $("#editLangLangsChk").prop("checked");
	var changeDesc = $("#editLangDescChk").prop("checked");

	if (!changeName && !changeDesc && !changeLang)
		return;

	var langID = $("#editLangID").val();
	var langName = $("#txtEditLangName").val().trim();
	var data = { langID: langID };

	if (changeName && langName == "") {
		displayError({responseText: "Name cannot be empty"});
		return;
	}

	if (changeName && langName != "")
		data['langName'] = langName;
	if (changeDesc)
		data['langDescription'] = $("#txtEditLangDesc").val();

	if (changeName || changeDesc) {
		$.ajax({
			url: "lang.php",
			type: "PUT",
			data: data,
			success: function () { successAlert("Successfully saved language: " + langName, "lang") },
			error: displayError
		});
	}

	if (changeLang) {
		var curLangsList = $("#lang-" + langID + "-card").data("langs");
		var newLangsList = $("#selectEditLangLangs").val().map(function (item) {
			return parseInt(item, 10);
		});

		var langsToAdd = inANotInB(newLangsList, curLangsList);
		manageAssocLang("lang", "PUT", langID, langsToAdd);

		var langsToDelete = inANotInB(curLangsList, newLangsList);
		manageAssocLang("lang", "DELETE", langID, langsToDelete);
	}
}

function handleLangClicked(evt, langID) {
	// TODO: show related snippets and resources
	evt.preventDefault();
	showLang(langID);
}
