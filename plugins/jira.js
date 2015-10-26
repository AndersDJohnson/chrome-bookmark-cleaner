var $ = require('jquery');

bookmarkCleaner.plugin('jira', {
  search: function () {
    return 'jira/browse';
  },
  handle: function (params, callback) {
    var that = this;

    var options = params.options;
    var archive = params.archive;
    var bookmark = params.bookmark;

    if (bookmark.parentId === archive.id) {
      console.log("Already archived.", bookmark);
      return Promise.resolve();
    }

    var url = bookmark.url;
    if (! url) {
      console.log('No URL: ' + url);
      return Promise.resolve();
    }
    var regex = /(.*)\/browse\/([A-Z]+\-[0-9]+)(?:\?.*)?$/;
    var match = url.match(regex);
    if (! match) {
      console.log('No match: ' + match + ' for URL: ' + url);
      return Promise.resolve();
    }
    var jiraBaseUrl = match[1];
    jiraBaseUrl = jiraBaseUrl.replace(/^https?:/, '');
    var key = match[2];

    return new Promise(function (resolve, reject) {
      that.getIssue(jiraBaseUrl, key).then(
        function (issue) {
          that.handleIssue({
            archiveFolder: archive,
            bookmark: bookmark,
            issue: issue,
            options: options
          }).then(resolve, reject);
        },
        function (err) {
          console.error('getIssue error:', err);
          // We'll resolve the promise anyway, to skip over errors.
          // reject(err);
          resolve(err);
        }
      );
    });
  },
  /**
   * TODO: Expose settings for statuses.
   */
  statuses: [
    'deployed',
    'cancelled',
    'resolved',
    'closed'
  ],
  handleIssue: function(params) {
    var that = this;
    return new Promise(function (resolve, reject) {
      params = params || {};
      var archive = params.archiveFolder;
      var bookmark = params.bookmark;
      var issue = params.issue;
      var options = params.options;
      var dryRun = options.dryRun;
      console.log('handling ', arguments);
      var key = issue.key;
      var status = issue.fields.status ? issue.fields.status.name : null;
      console.log(key, 'status', status);
      // var resolution = issue.fields.resolution ? issue.fields.resolution.name : null;
      // console.log(key, 'resolution', resolution);

      if (status && that.statuses.indexOf(status.toLowerCase()) > -1) {
        console.log('moving... dryRun=' + dryRun, bookmark, archive);
        if (dryRun) {
          resolve();
          return;
        }
        chrome.runtime.sendMessage({
          type: 'bookmarks',
          method: 'move',
          args: [bookmark.id, {parentId: archive.id}]
        }, function(response) {
          console.log('move response', response);
          resolve(response);
        });
      }
      else {
        resolve();
      }
    });
  },
  getIssue: function (jiraBaseUrl, key, callback) {
    return new Promise(function (resolve, reject) {
      var url = jiraBaseUrl + '/rest/api/latest/issue/' + key;

      console.log('Starting request to ' + url);

      $.ajax({
        url: url,
        dataType: 'json',
        // beforeSend: function(xhr) {
        //   // xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
        // }
      })
      .then(function (data, status, xhr) {
        console.log(arguments);
        resolve(data);
        // data.fields;
      })
      .fail(function (xhr, status, err) {
        console.error(arguments);
        reject(err);
      });
    });
  }
});
