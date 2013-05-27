var Fibers = Npm.require('fibers');
var net = Npm.require('net');
var http = Npm.require('http');


var server = net.createServer(function(socket) {
  process.on('uncaughtException', function (ex) {
    var payload = {'error': [ex.message, ex.stack] };
    sendToTest(payload);
  });
  
  socket.setNoDelay(true);
  socket.on('data', onData);
  function onData(data) {
    var source = JSON.parse(data.toString());
    Fibers(function() {
      eval('(' + source.func + ')(' + source.args.join(', ')+ ');');
    }).run();
  }

  socket.once('end', function() {
    emit = function() {};
    socket.removeListener('on', onData);
  });

  function emit() {
    var payload = { 'emit': arguments };
    sendToTest(payload);
  }

  function sendToTest(payload) {
    var jsonPayload = JSON.stringify(payload);
    socket.write(jsonPayload + '#DTF#');
  }

});

var port = getRandomPort();
server.listen(port, function() {
  console.log('laika code injected and listening on: ' + port);
});

function getRandomPort() {
  return Math.ceil(Math.random() * 20000) + 10000;
}