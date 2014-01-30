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
            return checkDOM() !== 0;
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
