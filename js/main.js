var selectList = [];

$(document).ready(function () {
	loadLangs();

	$("#langLink").click(function (e) {
		e.preventDefault();
		loadLangs();
	});
	$("#snippetLink").click(function (e) {
		e.preventDefault();
		loadSnippets();
	});
	$("#resourceLink").click(function (e) {
		e.preventDefault();
		loadResources();
	});

	$("#addModal").on("show.bs.modal", function (e) {
		$("#addLangTab").tab("show");
		$(".addField").val("");
		buildLangSelect();
	});
	$("#editLangModal").on("shown.bs.modal", function (e) { $(".langSelect").val(selectList); });
	$("#editSnippetModal").on("shown.bs.modal", function (e) { $(".langSelect").val(selectList); });
	$("#editResourceModal").on("shown.bs.modal", function (e) { $(".langSelect").val(selectList); });
	$("#addModal").on("shown.bs.modal", function (e) { $("#txtLangName").focus(); });
	$("#addLangTab").on("shown.bs.tab", function (e) { $("#txtLangName").focus(); });
	$("#addSnippetTab").on("shown.bs.tab", function (e) { $("#txtSnippetName").focus(); });
	$("#addResourceTab").on("shown.bs.tab", function (e) { $("#txtResourceName").focus(); });

	$("#btnAddItem").click(addNewItem);
	$("#btnSaveLang").click(saveLang);
	$("#btnSaveSnippet").click(saveSnippet);
	$("#btnSaveResource").click(saveResource);
	$(".clearLangSelect").click(function () { $(".langSelect").val([]); });

	$(".editChk").change(checkBoxChange);
});

function buildLangSelect() {
	$.ajax({
		url: "lang.php",
		type: "GET",
		success: addSelectLangs,
		error: displayError
	});
}

function addSelectLangs(langList) {
	var selectors = $(".langSelect");
	selectors.empty();
	for (let cur of langList) {
		$("<option>").val(cur.langID).text(cur.langName).appendTo(selectors);
	}
}

function checkBoxChange() {
	var me = $(this);
	$(me.data("for")).attr("disabled", !me.prop("checked"));
}

function addNewItem() {
	if ($("#addLangTab").hasClass("active")) {
		if ($("#formAddLang")[0].checkValidity()) {
			var data = {};
			data['langName'] = $("#txtLangName").val().trim();

			if ($("#txtLangDesc").val().trim() != "") {
				data['langDescription'] = $("#txtLangDesc").val().trim();
			}

			var langs = $("#selectLangLangs").val();

			$.ajax({
				url: "lang.php",
				type: "POST",
				data: data,
				success: function (res) { addLangLangs(res, data['langName'], langs); },
				error: displayError
			});
		}
	} else if ($("#addSnippetTab").hasClass("active")) {
		if ($("#formAddSnippet")[0].checkValidity()) {
			var data = {};
			data['snippetName'] = $("#txtSnippetName").val().trim();
			if ($("#txtSnippetDesc").val().trim() != "") {
				data['snippetDescription'] = $("#txtSnippetDesc").val().trim();
			}
			if ($("#txtSnippetBody").val().trim() != "") {
				data['snippet'] = $("#txtSnippetBody").val().trim();
			}

			var langs = $("#selectSnippetLangs").val();

			$.ajax({
				url: "snippet.php",
				type: "POST",
				data: data,
				success: function (res) { addSnippetLangs(res, data['snippetName'], langs) },
				error: displayError
			});
		}
	} else {
		if ($("#formAddResource")[0].checkValidity()) {
			var data = {};
			data['resourceName'] = $("#txtResourceName").val().trim();
			if ($("#txtResourceDesc").val().trim() != "") {
				data['resourceDescription'] = $("#txtResourceDesc").val().trim();
			}
			if ($("#txtResourceLink").val().trim() != "") {
				data['resourceLink'] = $("#txtResourceLink").val().trim();
			}

			var langs = $("#selectResourceLangs").val();

			$.ajax({
				url: "resource.php",
				type: "POST",
				data: data,
				success: function (res) { addResourceLangs(res, data['resourceName'], langs); },
				error: displayError
			});
		}
	}
}

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

function addResourceLangs(resourceID, resourceName, langIDList) {
	if (langIDList != null) {
		for (var i = 0; i < langIDList.length; i++) {
			$.ajax({
				url: "resource.php",
				type: "PUT",
				data: {resourceID: resourceID, langID: langIDList[i]},
				error: displayError
			});
		}
	}

	successAlert("Successfully Added resource: " + resourceName, "resource");
}

function successAlert(text, type) {
	var alert = $("#successAlert");

	if (alert.attr("display") == "none") {
		alert.slideUp();
	}

	alert.text(text).slideDown().delay(5000).slideUp();

	if (type.toLowerCase() == "lang")
		loadLangs();
	else if (type.toLowerCase() == "snippet")
		loadSnippets();
	else if (type.toLowerCase() == "resource")
		loadResources();

	$(".modal").modal('hide');
}

function loadResources() {
	$("#langLink").removeClass("active");
	$("#snippetLink").removeClass("active");
	$("#resourceLink").addClass("active");
	$("#mainList").empty();

	$.ajax({
		url: "resource.php",
		type: "GET",
		success: addResourceList,
		error: displayError
	});
}

function addResourceList(resourceList) {
	for (let resource of resourceList) {
		addResource(resource);
	}
}

function addResource(resource) {
	var link = $('<a>').attr({
		"id": "resource-" + resource.resourceID + "-link",
		"href": resource.resourceLink,
		"target": "_blank"
	}).text(resource.resourceLink);
	$("<div>").attr("id", "resource-" + resource.resourceID).appendTo($("#mainList"));
	buildCard("resource", resource.resourceID, resource.resourceName, resource.languages, resource.resourceDescription, link);
}

function showResource(resourceID) {
	deselectNav();
	$("#mainList").empty();

	$("<div>").attr("id", "resource-" + resourceID).appendTo($("#mainList"));
	$.ajax({
		url: "resource.php?resourceID=" + resourceID,
		type: "GET",
		success: function (result) { addResource(result); },
		error: function (result) { displayError(result); }
	});
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

function buildCard(type, id, name, languageList, DescriptionText, body) {
	var card = $('<div>').addClass("card mb-3").attr("id", type + "-" + id + "-card");
	var header = $('<div>').addClass("card-header").appendTo(card);
	$('<h3>').attr("id", type + "-" + id + "-name").addClass("d-inline").text(name).appendTo(header);
	$('<span>').attr("id", type + "-" + id + "-id").addClass("text-muted ml-3").text("#" + id).appendTo(header);

	$("<button>").attr({
		"type": "button",
		"class": "btn btn-danger float-right",
		"data-id": id,
		"data-type": type
	}).text("Delete").click(deleteClicked).appendTo(header);

	$("<button>").attr({
		"type": "button",
		"class": "btn btn-info float-right mr-2",
		"data-id": id,
		"data-type": type
	}).text("Edit").click(editClicked).appendTo(header);

	var cardBody = $('<div>').addClass("card-body").appendTo(card);
	var langList = $("<div>").addClass("langList").appendTo(cardBody);

	var langString = [];
	if (languageList != null && languageList.length > 0) {
		for (var i = 0; i < languageList.length; i++) {
			var cur = languageList[i];
			langString[i] = cur.langID;
			$("<a>").attr({
				"class": "card-link",
				"href": "#",
				"onClick": "handleLangClicked(event, " + cur.langID + ")"
			}).text(cur.langName).appendTo(langList);
		}
		card.attr("data-langs", JSON.stringify(langString));
	} else {
		card.attr("data-langs", "[]");
	}

	$('<p>').attr("id", type + "-" + id + "-description").addClass("card-text").text(DescriptionText).appendTo(cardBody);
	cardBody.append(body);

	card.append(cardBody);
	card.appendTo($("#" + type + "-" + id));
}

function editClicked() {
	var button = $(this);
	var type = button.data("type");
	var id = button.data("id");

	$(".editChk").prop("checked", false);
	$(".editField").prop("disabled", true);

	if (type == "lang")
		initEditLang(id);
	else if (type == "snippet")
		initEditSnippet(id);
	else
		initEditResource(id);
}

function initEditLang(langID) {
	$("#editLangID").val(langID);
	$("#txtEditLangName").val($("#lang-" + langID + "-name").text());
	$("#txtEditLangDesc").val($("#lang-" + langID + "-description").text());

	buildLangSelect();
	selectList = $("#lang-" + langID + "-card").data("langs");

	$("#editLangModal").modal('show');
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

function initEditResource(resourceID) {
	$("#editResourceID").val(resourceID);
	$("#txtEditResourceName").val($("#resource-" + resourceID + "-name").text());
	$("#txtEditResourceDesc").val($("#resource-" + resourceID + "-description").text());
	$("#txtEditResourceLink").val($("#resource-" + resourceID + "-link").text());

	buildLangSelect();
	selectList = $("#resource-" + resourceID + "-card").data("langs");

	$("#editResourceModal").modal('show');
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

function saveResource() {
	var changeName = $("#editResourceNameChk").prop("checked");
	var changeLang = $("#editResourceLangsChk").prop("checked");
	var changeDesc = $("#editResourceDescChk").prop("checked");
	var changeLink = $("#editResourceLinkChk").prop("checked");

	if (!changeName && !changeLang && !changeDesc && !changeLink)
		return;

	var resourceID = $("#editResourceID").val();
	var resourceName = $("#txtEditResourceName").val().trim();
	var data = { resourceID: resourceID };

	if (changeName && resourceName == "") {
		displayError({responseText: "Name cannot be empty"});
		return;
	}

	if (changeName)
		data['resourceName'] = resourceName;
	if (changeDesc)
		data['resourceDescription'] = $("#txtEditResourceDesc").val().trim();
	if (changeLink)
		data['resourceLink'] = $("#txtEditResourceLink").val().trim();

	$.ajax({
		url: "resource.php",
		type: "PUT",
		data: data,
		success: function () { successAlert("Successfully saved resource: " + resourceName, "resource"); },
		error: displayError
	});

	if (changeLang) {
		var curLangsList = $("#resource-" + resourceID + "-card").data("langs");
		var newLangsList = $("#selectEditResourceLangs").val().map(function (item) {
			return parseInt(item, 10);
		});

		var langsToAdd = inANotInB(newLangsList, curLangsList);
		manageAssocLang("resource", "PUT", resourceID, langsToAdd);

		var langsToDelete = inANotInB(curLangsList, newLangsList);
		manageAssocLang("resource", "DELETE", resourceID, langsToDelete);
	}
}

function manageAssocLang(type, action, id, langList) {
	for (let item of langList) {
		var data = { langID: item };
		data[type + "ID"] = id;
		$.ajax({
			url: type + ".php",
			type: action,
			data: data,
			error: displayError
		});
	}
}

function deleteClicked() {
	var button = $(this);
	var type = button.data("type");
	var id = button.data("id");

	$("#btnConfirmDelete").off('click').click(function () { deleteItem(type, id); });
	$("#confirmDeleteModal").modal('show');
}

function deleteItem(type, id) {
	var data = {};
	data[type + "ID"] = id;

	$.ajax({
		url: type + ".php",
		type: "DELETE",
		data: data,
		success: function (res) { successAlert("Item successfully deleted", type); },
		error: displayError
	});
}

function handleSnippetClicked(evt, snippetID) {
	evt.preventDefault();
	showSnippet(snippetID);
}

function handleResourceClicked(evt, resourceID) {
	evt.preventDefault();
	showResource(resourceID);
}

function handleLangClicked(evt, langID) {
	// TODO: show related snippets and resources
	evt.preventDefault();
	showLang(langID);
}

function deselectNav() {
	$("#langLink").removeClass("active");
	$("#snippetLink").removeClass("active");
	$("#resourceLink").removeClass("active");
}

function displayError(error, str) {
	console.log(error);
	$("#errorText").text(error.responseText);
	$("#errorModal").modal('show');
}

function inANotInB(a, b) {
	var list = [];
	for (let item of a) {
		if (b.indexOf(item) == -1)
			list.push(item);
	}
	return list;
}
