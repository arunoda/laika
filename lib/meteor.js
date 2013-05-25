var spawn = require('child_process').spawn;

function Meteor() {
  
  this.runAndClose = function run(options, callback) {
    options.appDir = options.appDir || './';
    options.port = options.port || 9000;
    
    var app = spawn('meteor', ['--port', options.port], {
      cwd: options.appDir
    });

    app.on('error', function(err) {
      if(err) throw err;
    });
        
    app.stdout.on('data', function() {
      
    });
  };
}

module.exports = new Meteor();