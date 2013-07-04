require('colors');

function Logger() {
  var verbose = false;
  var deepVerbose = false;

  this.setVerbose = function setVerbose(v) {
    verbose = v;
  };

  this.setDeepVerbose = function setVerbose(v) {
    deepVerbose = v;
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

  this.phantom = function touch(message) {
    if(verbose) {
      message = '[phantom log] '.yellow.bold + message;
      process.stdout.write(message);
    }
  };

  this.laika = function touch(message) {
    if(deepVerbose) {
      message = '[laika log] '.blue.bold + message;
      console.log(message);
    }
  };
}

module.exports = new Logger();