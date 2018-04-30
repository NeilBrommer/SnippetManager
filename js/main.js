var selectList = [];

$(document).ready(function () {
	loadLangs();

	$("#addModal").on("show.bs.modal", function (e) {
		$("#addLangTab").tab("show");
		$(".addField").val("");
		buildLangSelect();
	}).on("shown.bs.modal", function (e) {
		$("#txtLangName").focus();
	});

	$("#btnAddItem").click(addNewItem);
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
	langList.forEach(function (cur) {
		$("<option>").val(cur.langID).text(cur.langName).appendTo(selectors);
	});
}

function checkBoxChange() {
	var chk = $(this);
	$(chk.data("for")).attr("disabled", !chk.prop("checked"));
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

function successAlert(text, type) {
	var alert = $("#successAlert");

	if (alert.attr("display") != "none") {
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
		languageList.forEach(function (cur) {
			langString.push(cur.langID);
			$("<a>").attr({
				"class": "card-link",
				"href": "#",
				"onClick": "handleLangClicked(event, " + cur.langID + ")"
			}).text(cur.langName).appendTo(langList);
		});
		card.attr("data-langs", JSON.stringify(langString));
	} else {
		card.attr("data-langs", "[]");
	}

	$('<p>').attr("id", type + "-" + id + "-description")
		.addClass("card-text")
		.text(DescriptionText)
		.appendTo(cardBody);

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

function manageAssocLang(type, action, id, langList) {
	langList.forEach(function (item) {
		var data = { langID: item };
		data[type + "ID"] = id;
		$.ajax({
			url: type + ".php",
			type: action,
			data: data,
			error: displayError
		});
	});
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

function deselectNav() {
	$("#langLink").removeClass("active");
	$("#snippetLink").removeClass("active");
	$("#resourceLink").removeClass("active");
}

function displayError(error, str) {
	console.error(error);
	$("#errorText").text(error.responseText);
	$("#errorModal").modal('show');
}

function inANotInB(a, b) {
	var list = [];

	a.forEach(function (item) {
		if (b.indexOf(item) == -1)
			list.push(item);
	});

	return list;
}
