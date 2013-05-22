var util = require('util');
var EventEmitter = require('events').EventEmitter;

function DtfParser() {
  this.remainder = "";
}

util.inherits(DtfParser, EventEmitter);

DtfParser.prototype.parse = function(message) {
  var self = this;
  var message = this.remainder + message;
  var parts = message.split('#DTF#');

  //check there is a #DTF# at the end
  if(!(message.match(/#DTF#$/))) {
    this.remainder = parts.pop();
  } else {
    this.remainder = "";
  }

  parts.forEach(function(part) {
    if(part && part.trim() != "") {
      self.emit('data', part);
    }
  });
};

module.exports = DtfParser;