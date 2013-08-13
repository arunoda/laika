var App = require('./app');
var helpers = require('./helpers');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var colors = require('colors');
var path = require('path');
var exec = require('child_process').exec;
var fs = require('fs');

function AppPool(options) {
  var self = this;
  options = options || {};
  options.size = options.size || 4;
  options.appDir = options.appDir || './';

  var appConfig = detectConfig(options.appDir);
  appConfig.appDir = options.appDir;
  appConfig.mongoPort = options.mongoPort;

  var fiberModulesDir = path.resolve(options.appDir, '.meteor/local/build/server/node_modules/fibers');

  var pool = [];
  var oldApps = [];

  var count = 0;
  function createInitialPool() {
    if(count++ < options.size) {
      createApp(createInitialPool);
    } else {
      self.emit('ready');
    }
  }
  setTimeout(createInitialPool, 0);

  function createApp(callback) {
    var app = new App(appConfig);
    var dbname = 'laika-' + helpers.randomId(10);
    var port = helpers.getRandomPort();

    if(callback) app.ready(callback);
    app.start(dbname, port, options.settingsFile);
    pool.push(app);
  }

  this.get = function get() {
    var app = pool.shift();

    //a way we can close apps even they throw exceptions and close by mocha
    oldApps.push(app);
    app.once('close', function() {
      var index = oldApps.indexOf(app);
      oldApps.splice(index, 1);
    });

    createApp();
    return app;
  };

  this.close = function close(callback) {
    var totalApps = oldApps.length + pool.length;
    var closedAppCount = 0;

    oldApps.forEach(closeApp);
    pool.forEach(closeApp);

    function closeApp(app) {
      app.close(afterClosed);
    }

    function afterClosed() {
      if(++closedAppCount == totalApps) {
        callback();
      }
    }
  };

  //detect whether uses, meteor or meteorite and get the corret node version accordingly
  function detectConfig(appDir) {
    var config = {};
    var meteoriteUsed = fs.existsSync(path.resolve(appDir, './smart.json'));
    if(meteoriteUsed) {
      config.meteorite = true;
      config.nodeBinary = helpers.getMeteoriteNode(appDir);
    } else {
      config.meteorite = false;
      config.nodeBinary = helpers.getMeteorNode();
    }

    return config;
  }
}

util.inherits(AppPool, EventEmitter);

module.exports = AppPool;
