const webpack = require('webpack');

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // Add fallbacks for Node.js core modules
            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
            };

            // Ignore warnings about these modules
            webpackConfig.plugins.push(
                new webpack.IgnorePlugin({
                    resourceRegExp: /^(fs|path|crypto)$/,
                })
            );

            return webpackConfig;
        },
    },
};
