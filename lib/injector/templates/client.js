
window.waitForDOM = function(selector, callback) {
    var checker, observer, checkDOM;
    if(typeof selector === 'function') {
        checkDOM = selector;
    } else if(window.$ === undefined) {
        // You can use this without jQuery, but then you're limited to IDs or
        // passing a function
        if(selector[0] === '#') {
            checkDOM = function() {
                return document.getElementById(selector.substr(1)) !== null;
            }
        } else {
            throw new TypeError("When jQuery isn't installed, you're limited to selectors in the #id form. Or pass your own function!")
        }
    } else {
        checkDOM = function() {
            return $(selector).length !== 0;
        }
    }

    if(checkDOM()) {
        callback();
    } else if(window.MutationObserver !== undefined) {
        observer = new MutationObserver(function() {
            if(checkDOM()) {
                callback();
                observer.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: false
        });
    } else {
        checker = function() {
            if(checkDOM()) {
                return callback();
            } else {
                return Meteor.setTimeout(checker, 50);
            }
        };
        checker();
    }
};

window.waitForRoute = function(path, callback) {
  if (!Router || !Router.current) {
    throw new Error('waitForRoute currently only works with iron router');
  }
  if (Router.current().path == path) {
    callback();
  }
  else {
    Deps.autorun(function() {
      if (Router.current().path == path) {
        this.stop();
        callback();
      }
    });
    Router.go(path);
  }
}
