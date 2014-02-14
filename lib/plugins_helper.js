var logger = require('./logger');
var npm = require('npm');
var path = require('path');
var fs = require('fs');

var pluginsHelper = module.exports;

pluginsHelper.initialize = function (plugins, callback) {
  if(plugins.length == 0) return callback();

  logger.info('  loading plugins ' + plugins.join(', '));
  var inits = [];
  plugins.forEach(function (plugin) {
    if(plugin.helper.initialize !== undefined) {
      inits.push(plugin);
    }
  });

  if(inits.length === 0) {
    deps.tick();
  } else {
    var plugin_deps = qbox.create(inits.length);
    plugin_deps.ready(callback);

    inits.forEach(function (plugin) {
      logger.info('  initializing ' + plugin.name + '...');
      plugin.helper.initialize(function() {
        plugin_deps.tick();
      });
    });
  }
}

pluginsHelper.shutdown = function(plugins, callback) {
  var shutdowns = [];
  plugins.forEach(function (plugin) {
    if(plugin.helper.shutdown !== undefined) {
      shutdowns.push(plugin);
    }
  });
  if(shutdowns.length === 0) {
    callback();
  } else {
    var plugin_deps = qbox.create(shutdowns.length);
    plugin_deps.ready(callback);
    shutdowns.forEach(function (plugin) {
      logger.info('  initializing ' + plugin.name);
      plugin.helper.shutdown(function() {
        plugin_deps.tick();
      });
    });
  }
}

pluginsHelper.loadPackage = function (where, packageName) {
  var packagePath = path.resolve(where, 'node_modules', packageName);
  var package = require(packagePath);

  var helper = package.laikaHelper;
  if(helper !== undefined) {
    return {
      name: packageName,
      from: where,
      helper: helper
    };
  }
  return;
}

pluginsHelper._isPackageExists = function(where, packageName) {
  var packagePath = path.resolve(where, 'node_modules', packageName);
  return fs.existsSync(packagePath);
};

pluginsHelper.load = function (testsPath, callback) {
  testsPath = path.resolve(testsPath);

  try {
    var json = require(testsPath + '/package.json');
  } catch(error) {
    if(error.code === 'MODULE_NOT_FOUND') {
      callback(plugins);
      return;
    } else {
      throw error;
    }
  }

  var notInstalled = [];
  var spec = [];

  for(packageName in json.dependencies) {
    if(!pluginsHelper._isPackageExists(testsPath, packageName)) {
      notInstalled.push(packageName);
      spec.push(packageName + '@' + json.dependencies[packageName]);
    }
  }

  if(notInstalled.length === 0) {
    initializePlugins();
  } else {
    logger.info('  installing plug-ins: ' + notInstalled.join(', '));
    var cwd = process.cwd();
    process.chdir(testsPath);
    npm.load({verbose: process.argv.verbose}, function(error, Npm) {
      if(error) {
        // this doesn't seem to ever happen though
        logger.error('  failed to initialize Npm');
        logger.error(error);
        process.exit(1);
      }
      Npm.commands.install(spec, function(error, installed) {
        if(error != null) {
          logger.error('  ' + error.message);
          process.exit(1);
        }
        process.chdir(cwd);
        initializePlugins();
      });
    });
  }

  function initializePlugins() {
    var plugins = [];
    for(var packageName in json.dependencies) {
      var plugin = pluginsHelper.loadPackage(testsPath, packageName);
      //not all the packages are not plugins
      if(plugin) {
        plugins.push(plugin);
      }
    }

    pluginsHelper.initialize(plugins, function() {
      callback(plugins);
    });
  }
}