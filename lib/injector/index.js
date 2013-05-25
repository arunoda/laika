var fs = require('fs');
var handlebars = require('handlebars');
var path = require('path');
var mkdirp = require('mkdirp');
var util = require('util');
var http = require('http');
var EventEmitter =require('events').EventEmitter;
var helpers = require('../helpers');

function Injector(options) {
  var self = this;
  options = options || {};
  options.appDir = options.appDir || "./";

  var serverDir = path.resolve(options.appDir, 'server');
  var clientDir = path.resolve(options.appDir, 'client');
  var injectingServerFile = path.resolve(serverDir, 'meteor-suite-server.js');
  var injectingClientFile = path.resolve(clientDir, 'meteor-suite-client.js');

  var injectedCodeReady = false;

  this.inject = function(inject) {
    var serverCode = loadTemplate(path.resolve(__dirname, 'templates', 'server.js'), {});
    var clientCode = loadTemplate(path.resolve(__dirname, 'templates', 'client.js'), {});

    mkdirp.sync(serverDir);
    mkdirp.sync(clientDir);
 
    fs.writeFileSync(injectingServerFile, serverCode);
    fs.writeFileSync(injectingClientFile, clientCode);
  };

  this.clean = function clean() {
    try {fs.unlinkSync(injectingServerFile);} catch(ex) {}
    try {fs.unlinkSync(injectingClientFile);} catch(ex) {}
  }

  this.resetStatus = function resetStatus() {
    injectedCodeReady = false;
  };
}

util.inherits(Injector, EventEmitter);

module.exports = Injector;

function loadTemplate(location, fields) {
  var fileContent = fs.readFileSync(location, 'utf8');
  var template = handlebars.compile(fileContent);
  return template(fields);
}