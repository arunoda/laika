var Fibers = Npm.require('fibers');
var net = Npm.require('net');

var server = net.createServer(function(socket) {
  socket.on('data', onData);
  function onData(data) {
    var source = data.toString();
    Fibers(function() {
      eval('(' + source + ')();');
    }).run();
  }

  socket.once('end', function() {
    socket.removeListener('on', onData);
  });

  function emit() {
    var argsJson = JSON.stringify(arguments);
    socket.write(argsJson);
  }
});

server.listen({{port}});