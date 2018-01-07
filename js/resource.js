$(document).ready(function () {
	$("#resourceLink").click(function (e) {
		e.preventDefault();
		loadResources();
	});

	$("#editResourceModal").on("shown.bs.modal", function (e) {
		$(".langSelect").val(selectList);
	});

	$("#addResourceTab").on("shown.bs.tab", function (e) {
		$("#txtResourceName").focus();
	});

	$("#btnSaveResource").click(saveResource);
});

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

function initEditResource(resourceID) {
	$("#editResourceID").val(resourceID);
	$("#txtEditResourceName").val($("#resource-" + resourceID + "-name").text());
	$("#txtEditResourceDesc").val($("#resource-" + resourceID + "-description").text());
	$("#txtEditResourceLink").val($("#resource-" + resourceID + "-link").text());

	buildLangSelect();
	selectList = $("#resource-" + resourceID + "-card").data("langs");

	$("#editResourceModal").modal('show');
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

function handleResourceClicked(evt, resourceID) {
	evt.preventDefault();
	showResource(resourceID);
}
