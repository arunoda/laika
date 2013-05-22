var fs = require('fs');
var handlebars = require('handlebars');
var path = require('path');
var mkdirp = require('mkdirp');

function Injector(options) {
  options = options || {};
  options.appDir = options.appDir || "./";
  options.serverPort = options.serverPort || 7788;

  var serverDir = path.resolve(options.appDir, 'server');
  var clientDir = path.resolve(options.appDir, 'client');
  var injectingServerFile = path.resolve(serverDir, 'meteor-suite-server.js');
  var injectingClientFile = path.resolve(clientDir, 'meteor-suite-client.js');

  this.inject = function(inject) {
    var serverCode = loadTemplate(path.resolve(__dirname, 'templates', 'server.js'), {port: options.serverPort});
    var clientCode = loadTemplate(path.resolve(__dirname, 'templates', 'client.js'), {});

    mkdirp.sync(serverDir);
    mkdirp.sync(clientDir);
 
    fs.writeFileSync(injectingServerFile, serverCode);
    fs.writeFileSync(injectingClientFile, clientCode);
  };

  this.clean = function clean() {
    fs.unlinkSync(injectingServerFile);
    fs.unlinkSync(injectingClientFile);
  }
}

module.exports = Injector;

function loadTemplate(location, fields) {
  var fileContent = fs.readFileSync(location, 'utf8');
  var template = handlebars.compile(fileContent);
  return template(fields);
}