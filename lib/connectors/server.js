var net = require('net');

function ServerConnector(port) {
  var client = net.connect({port: port});
  client.on('data', onClientData);
  client.once('end', cleanup);

  var resultCallback;

  function onClientData(args) {
    if(resultCallback) {
      var args = objectToArray(JSON.parse(args));
      resultCallback.apply(null, args);
    }
  }

  function cleanup() {
    client.removeListener('data', onClientData);
  }

  this.run = function run(serverCode) {
    client.write(serverCode.toString());
    return this;
  };

  this.result = function result(callback) {
    resultCallback = callback;
    return this;
  };
}

module.exports = ServerConnector;

function objectToArray(obj) {
  var arr = [];
  for(var key in obj) {
    arr.push(obj[key]);
  }
  return arr;
}