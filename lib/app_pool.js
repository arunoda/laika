var App = require('./app');
var helpers = require('./helpers');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var colors = require('colors');
var path = require('path');
var exec = require('child_process').exec;

function AppPool(options) {
  var self = this;
  options = options || {};
  options.size = options.size || 4;
  options.appDir = options.appDir || './';

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
    var app = new App({appDir: options.appDir, mongoPort: options.mongoPort});
    var dbname = helpers.randomId(10);
    var port = helpers.getRandomPort();
    
    if(callback) app.ready(callback);
    app.start(dbname, port);  
    app.on('error', reinstallFiber);
    app.once('close', function() {
      app.removeListener('error', reinstallFiber);
    });
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

  this.close = function close() {
    oldApps.forEach(closeApp);
    pool.forEach(closeApp);

    function closeApp(app) {
      app.close();
    }
  };

  function reinstallFiber(error) {
    if(error.message == 'NODE_FIBER_ERROR') {
      console.log('  re-installing node-fibers'.red.bold);
      exec('npm install', {cwd: fiberModulesDir}, afterInstalled);
    } else {
      throw error;
    }
  }

  function afterInstalled(err, stdout, stderr) {
    if(err) {
      throw err;
    } else {
      console.log('  node-fibers reinstalled! run `laika` again!'.green.bold);
      self.emit('needExit');
    }
  }
}

util.inherits(AppPool, EventEmitter);

module.exports = AppPool;