var spawn = require('child_process').spawn;
var helpers = require('./helpers');

module.exports = function startWebDriver (port, callback) {

  if (typeof port === 'function') {
    callback = port;
    port = helpers.getRandomPort();
  }

  try {
    phantom = spawn('phantomjs', [ '--webdriver', port ]);
  } catch (err) {
    callback(err); // this function rethrows
  }

  phantom.on('error', function (err) {
    callback(err);
  });

  phantom.stdout.on('data', function (data) {
    if (/running on port/.test(data.toString())) {
      callback(null, "http://127.0.0.1:" + port);
    }
  });

  return phantom;
}

