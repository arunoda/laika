var App = require('./app');
var helpers = require('./helpers');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function AppPool(options) {
  var self = this;
  options = options || {};
  options.size = options.size || 4;
  options.appDir = options.appDir || './';

  var pool = [];
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
    var app = new App({appDir: options.appDir});
    var dbname = helpers.randomId(10);
    var port = helpers.getRandomPort();
    
    if(callback) app.ready(callback);
    app.start(dbname, port);  
    pool.push(app);
  }

  this.get = function get() {
    var app = pool.shift();
    createApp();
    return app;
  };

  this.close = function close() {
    pool.forEach(function(app) {
      app.close();
    });
  };
}

util.inherits(AppPool, EventEmitter);

module.exports = AppPool;