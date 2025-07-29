const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Supprime les avertissements de dépréciation webpack-dev-server
      if (webpackConfig.devServer) {
        delete webpackConfig.devServer.onAfterSetupMiddleware;
        delete webpackConfig.devServer.onBeforeSetupMiddleware;
        
        webpackConfig.devServer.setupMiddlewares = (middlewares, devServer) => {
          return middlewares;
        };
      }
      return webpackConfig;
    },
  },
};
