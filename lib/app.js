var spawn = require('child_process').spawn;
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;

function App(config) {
  var self = this;
  config = config || {};
  config.appDir = config.appDir || './';
  config.mongoPort = config.mongoPort || 27017;

  this.dbUrl;
  this.meteorApp;

  this.start = function start(dbname, port) {
    this.dbname = dbname;
    var args = ['--port', port];

    process.env.MONGO_URL = getMongoUrl(this.dbname);

    this.meteorApp = spawn('meteor', args, {
      cwd: config.appDir
    });

    this.meteorApp.on('error', function(err) {
      self.emit('error', err);
    });

    // this.meteorApp.stdout.pipe(process.stdout);
    this.meteorApp.stderr.pipe(process.stdout);
  };

  this.close = function close(callback) {
    if(this.meteorApp) {
      this.meteorApp.kill();
      MongoClient.connect(getMongoUrl(this.dbname), afterDbConnected);
    } else {
      callback();
    }

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


  function getMongoUrl(dbname) {
    return "mongodb://localhost:" + config.mongoPort + "/" + dbname;
  }
}

util.inherits(App, EventEmitter);

module.exports = App;