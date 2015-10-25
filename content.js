(function () {
  var injected = function () {
    window.bookmarkCleaner = function (options) {
      var customEventInit = {
        detail: {
          options: options
        }
      };
      var event = new CustomEvent("bookmarkCleaner", customEventInit);
      document.dispatchEvent(event);
    };
  };
  var innerHTML = ';(' + injected.toString() + ')();';
  var script = document.createElement("script");
  script.innerHTML = innerHTML;
  document.body.appendChild(script);
})();

(function () {
  window.bookmarkCleaner = bookmarkCleaner;

  document.addEventListener('bookmarkCleaner', function (e) {
    var detail = e.detail || {};
    console.log("received " + detail);
    bookmarkCleaner(detail.options);
  });

  var plugins = {};

  bookmarkCleaner.plugin = function (name, plugin) {
    plugin.name = name;
    plugins[name] = plugin;
  };

  function bookmarkCleaner(options) {
    options = options || {};

    console.log('bookmarkCleaner', options);

    var dryRun = options.dryRun;


    getOrCreateBookmark({
      title: 'bookmark-cleaner-archive'
    }, {
      dryRun: dryRun
    }, function(err, response) {
      if (err) throw err;
      console.log('response', response);

      var archive = response.bookmark;
      if (! archive) {
        var e = new Error("No archive folder found.");
        console.error(e);
        throw e;
      }

      console.log('archive folder', archive);

      Object.keys(plugins).forEach(function (key) {
        var plugin = plugins[key];

        var search = plugin.search();

        /**
         * https://developer.chrome.com/extensions/messaging
         */
        chrome.runtime.sendMessage({
          type: 'bookmarks',
          method: 'search',
          args: [search]
        }, function(response) {
          console.log(response);
          if (! response) throw new Error("No response for bookmarks.");
          var bookmarks = response.results || [];
          console.log('bookmarks', bookmarks);
          // bookmarks = bookmarks.slice(0, 100);

          var promises = [];

          bookmarks.forEach(function (bookmark) {
            var promise = plugin.handle({
              options: options,
              archive: archive,
              bookmark: bookmark
            });
            promise.then(function () {
              console.log('done handling bookmark for plugin "' + plugin.name + '": ', bookmark);
            }, function (err) {
              console.error(err);
            });
            promises.push(promise);
          });

          // TODO: Consider Promise.settle, e.g. https://www.npmjs.com/package/promise-settle
          Promise.all(promises).then(function () {
            console.log('Done with plugin "' + plugin.name + '".');
          }, function (err) {
            console.error(err);
          });

        });
      });

    });

    function getOrCreateBookmark(data, options, callback) {
      var dryRun = options.dryRun;

      chrome.runtime.sendMessage({
        type: 'bookmarks',
        method: 'search',
        args: [data]
      }, function(response) {
        console.log('response', response);

        var archive = response.results[0];

        if (archive || dryRun) {
          callback(null, {bookmark: archive});
          return;
        }

        chrome.runtime.sendMessage({
          type: 'bookmarks',
          method: 'create',
          args: [data]
        }, function(response) {
          console.log('response', response);

          if (response) {
            callback(null, {
              bookmark: response.results
            });
            return;
          }
          callback('ERROR');
        });
      });
    }

  }

})();
