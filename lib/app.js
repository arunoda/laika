var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var helpers = require('./helpers');
var path = require('path');
var fs = require('fs');

function App(config) {
  var self = this;
  config = config || {};
  config.appDir = config.appDir || './';
  config.mongoPort = config.mongoPort || 27017;

  this.dbUrl;
  this.meteorApp;
  var laikaInjectPort;

  this.start = function start(dbname, port) {
    this.dbname = dbname;
    this.port = port;

    var serverDir = path.resolve(config.appDir, '.meteor/local/build/server');
    var serverJs = path.resolve(serverDir, 'server.js');
    var args = [serverJs];

    process.env.MONGO_URL = App.getMongoUrl(config.mongoPort, this.dbname);
    process.env.PORT = port;
    process.env.ROOT_URL = 'http://localhost:' + port;

    this.meteorApp = spawn('node', args, {
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
    });

    this.meteorApp.stdout.on('data', function(data) {
      data = data.toString();
      // console.log(port, "::", data);
      if(data.match(/error/i)) {
        var message = '[ Server Crashed ] ' + data.toString();
        // console.log(message.red.bold);
        var error = new Error(message);
        error.stack = message;
        throw error;
      }
    });

    this.meteorApp.stderr.on('data', function(data) {
      var dataString = data.toString();
      if(dataString.match('node-fibers')) {
        //need to re-install node-fibers (meteorite error)
        self.emit('error', new Error('NODE_FIBER_ERROR'));
      } else {
        console.log(dataString);
      }
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
      helpers.dropMongoDatabase(mongoUrl);
      //simply firing callback() makes tests to run faster. 
      //saves time took to drop the db at the server
      callback();
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
  var app = spawn(meteorBinary, ['--port', port], {
    cwd: options.appDir,
    env: process.env
  });

  app.once('error', onError);
  app.stdout.on('data', onData);

  function onError(err) {
    if(err) throw err;
  }

  function onData(data) {
    if(data.toString().match('Meteor server')) {
      callback();
      cleanup();
    }
  }
  
  function cleanup() {
    app.removeListener('error', onError);
    app.removeListener('data', onData);
    app.kill('SIGKILL');
  }

  function detectMeteorBinary() {
    return (fs.existsSync('./smart.json'))? 'mrt': 'meteor';
  }
};

module.exports = App;