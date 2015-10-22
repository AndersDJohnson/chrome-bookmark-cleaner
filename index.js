var url = 'https://example.com/jira/rest/api/latest/issue/APP-100';
// var url = 'https://example.com/jira/rest/api/latest/issue/APP-100?os_username=XXX&os_password=XXX';
var username = 'XXX';
var password = 'XXX';

$.ajax({
	url: url,
	dataType: 'json',
	beforeSend: function(xhr) {
		xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
	}
})
.then(function (data, status, xhr) {
	console.log(arguments);
	// data.fields;
})
.fail(function () {
	console.log(arguments);
});
