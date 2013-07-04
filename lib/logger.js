require('colors');

function Logger() {
  var verbose = false;

  this.setVerbose = function setVerbose(v) {
    verbose = v;
  };

  this.info = function info(message) {
    console.log(message.blue.bold);
  };

  this.error = function info(message) {
    console.log(message.red.bold);
  };

  this.log = function info(message) {
    console.log(message);
  };

  //verbose messgages
  this.server = function info(message) {
    if(verbose) {
      message = '[server log] '.green.bold + message;
      process.stdout.write(message);
    } 
  };

  this.client = function info(message) {
    if(verbose) {
      message = '[client log] '.magenta.bold + message;
      console.log(message);
    }
  };

  this.touch = function touch(message) {
    if(verbose) {
      message = '[app touch log] '.cyan.bold + message;
      process.stdout.write(message);
    }
  };
}

module.exports = new Logger();