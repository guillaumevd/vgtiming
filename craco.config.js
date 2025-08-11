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

      // Complètement désactiver toutes les optimisations CSS pour éviter l'erreur
      if (webpackConfig.optimization && webpackConfig.optimization.minimizer) {
        webpackConfig.optimization.minimizer = [];
      }

      // Alternative: désactiver l'optimisation en général
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        minimize: false
      };

      return webpackConfig;
    },
  },
  devServer: {
    port: 3000,
    hot: true,
    open: false,
  },
};
