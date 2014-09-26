var Fibers = require('fibers');
var Future = require('fibers/future');
var MongoClient = require('mongodb').MongoClient;
var path = require('path');
var url = require('url');
var fs = require('fs');
var util = require('util');

exports.randomId = function randomId(noOfTexts) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < noOfTexts; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

exports.objectToArray = function objectToArray(obj) {
  var arr = [];
  for(var key in obj) {
    arr.push(obj[key]);
  }
  return arr;
};

exports.getRandomPort = function getRandomPort() {
  return Math.ceil(Math.random() * 20000) + 10000;
};

exports.getMeteorToolsPath = function getMeteorToolsPath() {
  var version = fs.readFileSync('.meteor/release').toString().trim();

  // support both the old and the new (METER@x.x.x) version style
  version = version.split('@')[1] || version;

  var release;

  // even though this comparision method is really naive, it should work just fine
  if (version < "0.9.0") {
    release = require(util.format('%s/.meteor/releases/%s.release.json', process.env.HOME, version));
    return util.format('%s/.meteor/tools/%s', process.env.HOME, release.tools);
  }

  // this is basically the same thing the original meteor script is doing
  // (see ~/.meteor/meteor) to find out the correct path to node exectuable

  var meteorHome = path.resolve(process.env.HOME, '.meteor');
  var meteorLink = path.resolve(meteorHome, fs.readlinkSync(path.join(meteorHome, 'meteor')));

  meteorLink = meteorLink.split(path.sep);
  meteorLink[meteorLink.length - 1] = 'dev_bundle';

  return path.sep + path.join.apply(path, meteorLink);
}

exports.getMeteorNode = function getMeteorNode() {
  if(process.env.METEOR_PATH) {
    return path.resolve(process.env.METEOR_PATH, 'dev_bundle/bin/node');
  } else {
    var meteorToolsPath = exports.getMeteorToolsPath();
    return path.resolve(meteorToolsPath, 'bin/node');
  }
};

exports.getMeteoriteNode = function getMeteoriteNode(appPath) {
  var homePath = process.env.HOME;
  smartLockFile = path.resolve(appPath, 'smart.lock');
  var smartLockFileContent = fs.readFileSync(smartLockFile, 'utf8');
  var smartLockFileJSON = JSON.parse(smartLockFileContent);

  if(smartLockFileJSON.meteor.git) {
    var repoNamespace = getGitNamespace(smartLockFileJSON.meteor.git);
    var commitSha = smartLockFileJSON.meteor.commit;
    return path.resolve(homePath, '.meteorite/meteors', repoNamespace, commitSha, 'dev_bundle/bin/node');
  } else {
    return exports.getMeteorNode();
  }

  function getGitNamespace(gitUrl) {
    var parsed = url.parse(gitUrl);
    return parsed.path.replace(/.git$/, '').replace(/^\//, '')
  }
}

exports.makeAssertFiberFriendly = function makeAssertFiberFriendly() {
  var assert = require('assert');
  var methods = ['fail', 'ok', 'equal', 'notEqual', 'deepEqual', 'notDeepEqual', 'strictEqual', 'notStrictEqual', 'throws', 'doesNotThrow', 'ifError'];
  methods.forEach(function(methodName) {
    assert[methodName] = makeFiberReady(assert[methodName]);
  });

  function makeFiberReady(method) {
    return function() {
      var args = arguments;
      if(Fibers.current) {
        var future = new Future();
        
        process.nextTick(function() {
          method.apply(assert, args);
          future.return();
        });

        future.wait();
      } else {
        method.apply(assert, args);
      }
    };
  }
};

exports.checkForMongoDB = function checkForMongoDB(mongoUrl, callback) {
  MongoClient.connect(mongoUrl, function(err, db) {
    if(err) {
      callback(false, err);
    } else {
      callback(true);
      db.close();
    }
  });
};

exports.dropMongoDatabase = function dropMongoDatabase(mongoUrl, callback) {
  var database;
  MongoClient.connect(mongoUrl, function(err, db) {
    if(err) {
      if(callback) callback(err);
    } else {
      db.dropDatabase(afterDropped);
      database = db;
    }
  });

  function afterDropped(err) {
    if(err) {
      if(callback) callback(err);
    } else {
      if(callback) callback();
      database.close();
    }
  }
}


