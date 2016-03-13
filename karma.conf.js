// Karma configuration
// Generated on Tue Dec 29 2015 22:20:18 GMT+0100 (CET)

module.exports = function(config) {

  var configuration = {
    basePath: '',
    frameworks: ['mocha', 'chai'],
    files: [
      { pattern: 'hyacinth.js', included: false, served: false },
      'test/**/*.test.js'
    ],
    exclude: [ '**/*.swp' ],
    preprocessors: {
      'test/**/*.test.js': ['webpack', 'sourcemap']
    },
    webpack: { devtool: 'inline-source-map' },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Firefox', 'Chrome'],
    singleRun: false,
    concurrency: Infinity,
    client: { captureConsole: true, mocha: { bail: true } }
  };

  if (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) {
    var customLaunchers = {
      'SL_Chrome': {
        base: 'SauceLabs',
        platform: 'OS X 10.11',
        browserName: 'chrome'
      },
      'SL_Firefox': {
        base: 'SauceLabs',
        platform: 'OS X 10.11',
        browserName: 'firefox'
      },
      'SL_Edge': {
        base: 'SauceLabs',
        platform: 'Windows 10',
        browserName: 'microsoftedge'
      }
    };

    configuration.reporters.push('saucelabs');
    configuration.sauceLabs = {
      testName: 'Karma and Sauce Labs demo',
      recordScreenshots: false,
      connectOptions: {
        port: 5757,
        logfile: 'sauce_connect.log'
      },
      public: 'public'
    };
    // Increase timeout in case connection in CI is slow
    configuration.captureTimeout = 120000;
    configuration.customLaunchers = customLaunchers;
    configuration.browsers = Object.keys(customLaunchers);
  }

  config.set(configuration);
}
