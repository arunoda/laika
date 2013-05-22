var Fibers = Npm.require('fibers');
var net = Npm.require('net');

var server = net.createServer(function(socket) {
  socket.setNoDelay(true);
  socket.on('data', onData);
  function onData(data) {
    var source = data.toString();
    Fibers(function() {
      eval('(' + source + ')();');
    }).run();
  }

  socket.once('end', function() {
    emit = function() {};
    socket.removeListener('on', onData);
  });

  function emit() {
    var argsJson = JSON.stringify(arguments);
    socket.write(argsJson + '#DTF#');
  }
});

server.listen(10074);