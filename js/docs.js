$(document).ready(function () {
	$("#languageForm").submit(languageSubmit);
	$("#snippetForm").submit(snippetSubmit);
	$("#resourceForm").submit(resourceSubmit);
});

function languageSubmit(e) {
	e.preventDefault();
	var type = $("#languageType").val();
	var data = {};

	if (type == "GET" || type == "DELETE") {
		var langID = $("#languageLangID").val();
		var assoc = $("#languageAssocLang").val();

		if (langID != "")
			data['langID'] = langID;
		if (assoc != "")
			data['associatedLang'] = assoc;
	} else if (type == "POST") {
		var langName = $("#languageLangName").val();
		var langDesc = $("#languageLangDesc").val();
		var assoc = $("#languageAssocLang").val();

		if (langName != "")
			data['langName'] = langName;
		if (langDesc != "")
			data['langDescription'] = langDesc;
		if (assoc != "")
			data['associatedLang'] = assoc;
	} else { // PUT
		var langID = $("#languageLangID").val();
		var langName = $("#languageLangName").val();
		var langDesc = $("#languageLangDesc").val();
		var assoc = $("#languageAssocLang").val();

		if (langID != "")
			data['langID'] = langID;
		if (langName != "")
			data['langName'] = langName;
		if (langDesc != "")
			data['langDescription'] = langDesc;
		if (assoc != "")
			data['associatedLang'] = assoc;
	}

	makeRequest(type, "lang.php", data, $("#languageResults"));
}

function snippetSubmit(e) {
	e.preventDefault();
	var type = $("#snippetType").val();
	var data = {};

	if (type == "GET" || type == "DELETE") {
		var snippetID = $("#snippetSnippetID").val();
		var assoc = $("#snippetLangID").val();

		if (snippetID != "")
			data['snippetID'] = snippetID;
		if (assoc != "")
			data['langID'] = assoc;
	} else if (type == "POST") {
		var snippetName = $("#snippetSnippetName").val();
		var snippetDesc = $("#snippetSnippetDesc").val();
		var body = $("#snippetSnippetBody").val();
		var assoc = $("#snippetLangID").val();

		if (snippetName != "")
			data['snippetName'] = snippetName;
		if (snippetDesc != "")
			data['snippetDescription'] = snippetDesc;
		if (body != "")
			data['snippet'] = body;
		if (assoc != "")
			data['langID'] = assoc;
	} else { // PUT
		var snippetID = $("#snippetSnippetID").val();
		var snippetName = $("#snippetSnippetName").val();
		var snippetDesc = $("#snippetSnippetDesc").val();
		var body = $("#snippetSnippetBody").val();
		var assoc = $("#snippetLangID").val();

		if (snippetID != "")
			data['snippetID'] = snippetID;
		if (snippetName != "")
			data['snippetName'] = snippetName;
		if (snippetDesc != "")
			data['snippetDescription'] = snippetDesc;
		if (body != "")
			data['snippet'] = body;
		if (assoc != "")
			data['langID'] = assoc;
	}

	makeRequest(type, "snippet.php", data, $("#snippetResults"));
}

function resourceSubmit(e) {
	e.preventDefault();
	var type = $("#resourceType").val();
	var data = {};

	if (type == "GET" || type == "DELETE") {
		var resourceID = $("#resourceResourceID").val();
		var assoc = $("#resourceLangID").val();

		if (resourceID != "")
			data['resourceID'] = resourceID;
		if (assoc != "")
			data['langID'] = assoc;
	} else if (type == "POST") {
		var resourceName = $("#resourceResourceName").val();
		var resourceDesc = $("#resourceResourceDesc").val();
		var link = $("#resourceResourceLink").val();
		var assoc = $("#resourceLangID").val();

		if (resourceName != "")
			data['resourceName'] = resourceName;
		if (resourceDesc != "")
			data['resourceDescription'] = resourceDesc;
		if (link != "")
			data['resourceLink'] = link;
		if (assoc != "")
			data['langID'] = assoc;
	} else { // PUT
		var resourceID = $("#resourceResourceID").val();
		var resourceName = $("#resourceResourceName").val();
		var resourceDesc = $("#resourceResourceDesc").val();
		var link = $("#resourceResourceLink").val();
		var assoc = $("#resourceLangID").val();

		if (resourceID != "")
			data['resourceID'] = resourceID;
		if (resourceName != "")
			data['resourceName'] = resourceName;
		if (resourceDesc != "")
			data['resourceDescription'] = resourceDesc;
		if (link != "")
			data['resourceLink'] = link;
		if (assoc != "")
			data['langID'] = assoc;
	}

	makeRequest(type, "resource.php", data, $("#resourceResults"));
}

function makeRequest(type, endpoint, data, resultsSection) {
	$.ajax({
		url: endpoint,
		type: type,
		data: data,
		success: function (res, status, xhr) { insertSuccess(res, xhr, resultsSection); },
		error: function (xhr, status, err) { insertError(xhr, resultsSection); }
	});
}

function insertSuccess(results, xhr, resultsSection) {
	var str = xhr.getAllResponseHeaders() + "\r\nStatus Code: " + xhr.status + " " + xhr.statusText;
	if (results != null) {
		if (typeof results === 'string' || results instanceof String)
			str += "\r\n\r\n" + results;
		else
			str += "\r\n\r\n" + JSON.stringify(results, null, 4);
	}
	resultsSection.text(str);
}

function insertError(xhr, resultsSection) {
	var str = xhr.getAllResponseHeaders() + "\r\nStatus Code: " + xhr.status + " " + xhr.statusText;
	if (xhr.responseText != null)
		str += "\r\n\r\n" + xhr.responseText;
	resultsSection.text(str);
}
