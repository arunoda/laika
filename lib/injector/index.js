var fs = require('fs');
var handlebars = require('handlebars');
var path = require('path');
var mkdirp = require('mkdirp');
var util = require('util');
var http = require('http');
var EventEmitter =require('events').EventEmitter;

function Injector(options) {
  var self = this;
  options = options || {};
  options.appDir = options.appDir || "./";
  options.injectPort = options.injectPort || 7788;
  options.notificationPort = options.notificationPort || 7789;

  var serverDir = path.resolve(options.appDir, 'server');
  var clientDir = path.resolve(options.appDir, 'client');
  var injectingServerFile = path.resolve(serverDir, 'meteor-suite-server.js');
  var injectingClientFile = path.resolve(clientDir, 'meteor-suite-client.js');

  var injectedCodeReady = false;

  this.inject = function(inject) {
    var serverCode = loadTemplate(path.resolve(__dirname, 'templates', 'server.js'), {
      injectPort: options.injectPort,
      notificationPort: options.notificationPort
    });
    var clientCode = loadTemplate(path.resolve(__dirname, 'templates', 'client.js'), {});

    mkdirp.sync(serverDir);
    mkdirp.sync(clientDir);
 
    fs.writeFileSync(injectingServerFile, serverCode);
    fs.writeFileSync(injectingClientFile, clientCode);
  };

  var notificationServer = http.createServer(function(req, res) {
    if(injectedCodeReady) {
      self.emit('interrupted');
    } else {
      injectedCodeReady = true;
      self.emit('ready');
    }
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('ok');
  });
  notificationServer.listen(options.notificationPort);

  this.clean = function clean() {
    try {fs.unlinkSync(injectingServerFile);} catch(ex) {}
    try {fs.unlinkSync(injectingClientFile);} catch(ex) {}
    notificationServer.close();
  }
}

util.inherits(Injector, EventEmitter);

module.exports = Injector;

function loadTemplate(location, fields) {
  var fileContent = fs.readFileSync(location, 'utf8');
  var template = handlebars.compile(fileContent);
  return template(fields);
}