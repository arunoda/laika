var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var helpers = require('./helpers');
var logger = require('./logger');
var path = require('path');
var fs = require('fs');
require('colors');

function App(config) {
  var self = this;
  config = config || {};
  config.appDir = config.appDir || './';
  config.mongoPort = config.mongoPort || 27017;

  this.dbUrl;
  this.meteorApp;
  var laikaInjectPort;

  this.start = function start(dbname, port, settingsFile) {
    this.dbname = dbname;
    this.port = port;

    var serverDir = path.resolve(config.appDir, '.meteor/local/build');
    var serverJs = path.resolve(serverDir, 'main.js');
    var args = [serverJs];

    process.env.MONGO_URL = App.getMongoUrl(config.mongoPort, this.dbname);
    process.env.PORT = port;
    process.env.ROOT_URL = 'http://localhost:' + port;

    if (settingsFile) {
      process.env.METEOR_SETTINGS = JSON.stringify(require(settingsFile));
    }

    var meteorBin = (config.meteorite)? 'meteorite': 'meteor';
    logger.laika('using nodejs bin' + '(from ' +  meteorBin + ')' + ': ' + config.nodeBinary);
    this.meteorApp = spawn(config.nodeBinary, args, {
      cwd: config.appDir,
      env: process.env
    });

    this.meteorApp.on('error', function(err) {
      self.emit('error', err);
    });

    this.meteorApp.stdout.on('data', function(data) {
      //match the console.log printed by injected laika code
      var exp = /laika code injected and listening on: (.*)/;
      var matched = data.toString().match(exp);
      if(matched) {
        laikaInjectPort = matched[1];
        self.emit('ready', laikaInjectPort);
      }

      logger.server(data.toString());
    });

    this.meteorApp.stdout.on('data', function(data) {
      data = data.toString();
      if(data.match(/error/i)) {
        var message = '[ Server Crashed ] ' + data.toString();
        var error = new Error(message);
        error.stack = message;
        throw error;
      }
    });

    this.meteorApp.stderr.on('data', function(data) {
      logger.server(data.toString());
    });
  };

  this.ready = function ready(callback) {
    if(laikaInjectPort) {
      callback(laikaInjectPort);
    } else {
      this.on('ready', callback);
    }
  };

  this.close = function close(callback) {
    this.emit('close');
    if(this.meteorApp) {
      this.meteorApp.stderr.removeAllListeners('data');
      this.meteorApp.stdout.removeAllListeners('data');
      this.meteorApp.removeAllListeners('error');
      this.meteorApp.kill('SIGKILL');

      var mongoUrl = App.getMongoUrl(config.mongoPort, this.dbname);
      helpers.dropMongoDatabase(mongoUrl, callback);
    } else {
      callback();
    }

    this.removeAllListeners('ready');
  };
}

util.inherits(App, EventEmitter);

App.getMongoUrl = function getMongoUrl(port, dbname) {
    return "mongodb://localhost:" + port + "/" + dbname;
};

App.touch = function touch(callback, options) {
  options = options || {};
  options.mongoPort = options.mongoPort || 27017;
  options.appDir = options.appDir || './';

  var port = helpers.getRandomPort();
  var dbname = '_laika';
  var dbUrl = App.getMongoUrl(options.mongoPort, dbname);

  process.env.MONGO_URL = dbUrl;
  var meteorBinary = detectMeteorBinary();
  if (process.platform ==="win32") {
    meteorBinary = meteorBinary  + ".bat";
    process.env.HOME = process.env.LOCALAPPDATA;
  }
  var app = spawn(meteorBinary, ['--port', port], {
    cwd: options.appDir,
    env: process.env
  });

  app.once('error', onError);
  app.stdout.on('data', onData);
  app.stderr.on('data', onErrorData);

  function onError(err) {
    if(err) throw err;
  }

  function onData(data) {
    if(data.toString().match('Meteor server')) {
      callback();
      cleanup();
    }
    logger.touch(data.toString());
  }

  function onErrorData(data) {
    logger.touch(data.toString());
  }

  function cleanup() {
    app.removeListener('error', onError);
    app.stdout.removeListener('data', onData);
    app.stderr.removeListener('data', onErrorData);
    app.kill('SIGKILL');
  }

  function detectMeteorBinary() {
    return (fs.existsSync('./smart.json'))? 'mrt': 'meteor';
  }
};

module.exports = App;
