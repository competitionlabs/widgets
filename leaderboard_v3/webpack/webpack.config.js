require('../src/config/Configuration'); //Global configurations
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

// default-theme is reserved
module.exports = (env) => {
  const argv = yargs(hideBin(process.argv)).argv

  if (typeof process.env.THEME !== "undefined" && typeof process.env.THEME === "string" && process.env.THEME.length > 0){
    global._THEME = process.env.THEME;
  }

  if(typeof argv.theme === "string" && argv.theme.length > 0){
    global._THEME = argv.theme;
  }

  const webpackDevConfig = require('./webpack.dev.config');
  const webpackProdConfig = require('./webpack.prod.config');
  const webpackLayoutsConfig = require('./webpack.layouts.config');

  if (process.env && process.env.production) {
    if (process.env.production === "prod") {
      return webpackProdConfig;
    } else if (process.env.production === "layouts") {
      return webpackLayoutsConfig;
    } else {
      return webpackDevConfig;
    }
  } else {
    return webpackDevConfig; // default config
  }
};
