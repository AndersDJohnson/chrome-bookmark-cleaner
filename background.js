(function () {

  var bind = function (self, fnKey, args) {
    args = args.slice();
    args.unshift(self);
    var fn = self[fnKey];
    return fn.bind.apply(fn, args);
  };

  /**
   * https://developer.chrome.com/extensions/messaging
   */
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(
      sender.tab ?
      'from a content script: ' + sender.tab.url :
      'from the extension'
    );
    console.log('request', request);
    if (request.type === 'bookmarks') {
      /**
       * https://developer.chrome.com/extensions/bookmarks
       * 
       * https://groups.google.com/forum/#!topic/chromium-extensions/RBopMGlqPm0
       */
      // search, move, create
      var bound = bind(chrome.bookmarks, request.method, request.args);
      bound(function (results) {
        console.log('results', results);
        sendResponse({results: results});
      });
      return true;
    }

    sendResponse(null);
    return true;
  });

})();
