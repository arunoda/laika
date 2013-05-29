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
      MongoClient.connect(App.getMongoUrl(config.mongoPort, this.dbname), afterDbConnected);
    } else {
      callback();
    }

    this.removeAllListeners('ready');

    function afterDbConnected(err, db) {
      if(err) {
        if(callback) callback(err);
      } else {
        db.dropDatabase(afterDropped);
      }

      function afterDropped(err) {
        db.close();
        if(callback) callback(err);
      }
    }
  };
}

util.inherits(App, EventEmitter);

App.getMongoUrl = function getMongoUrl(port, dbname) {
    return "mongodb://localhost:" + port + "/" + dbname;
};

App.touch = function touch(callback) {
  var port = helpers.getRandomPort();
  var dbUrl = App.getMongoUrl(27017, helpers.randomId(10));

  process.env.MONGO_URL = dbUrl;
  var meteorBinary = detectMeteorBinary();
  var app = spawn(meteorBinary, ['--port', port], {
    cwd: './',
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