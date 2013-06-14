var Fibers = require('fibers');
var Future = require('fibers/future');
var MongoClient = require('mongodb').MongoClient;

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


