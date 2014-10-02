window.emit = function emit() {

  if(window.callPhantom) {
    //we need comverts arguments object into a array to be stringified in phantomjs
    arguments = Array.prototype.slice.call(arguments, 0);
    payload = JSON.stringify(arguments);

    window.callPhantom(payload);
  }
};

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

// XXX this is a very ugly but necessary workaround due to a phantomjs BUG:
// https://github.com/ariya/phantomjs/issues/10832

var _setTimeout = window.setTimeout;
var _setInterval = window.setInterval;
var _clearTimeout = window.clearTimeout;
var _clearInterval = window.clearInterval;
var _related = {};

window.setTimeout = function (callback, duration) {
  var handle = _setTimeout(function () {
    _related[handle] = _setTimeout(callback, duration);
  }, 0);
  return handle;
};

// XXX this is ugly I guess :P
window.setInterval = function (callback, interval) {
  var handle = _setTimeout(function () {
    _related[handle] = _setInterval(callback, interval);
  }, 0);
  return handle;
};

window.clearTimeout = function (handle) {
  _setTimeout(function () {
    var related = _related[handle];
    if (related !== undefined) {
      _clearTimeout(related);
      delete _related[handle];
    }
    _clearTimeout(handle);
  }, 0);
};

window.clearInterval = function (handle) {
  _setTimeout(function () {
    var related = _related[handle];
    if (related !== undefined) {
      _clearInterval(related);
      delete _related[handle];
    }
    _clearInterval(handle);
  }, 0);
};
