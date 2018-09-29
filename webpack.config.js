const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');

const nodeEnv = process.env.NODE_ENV === 'production' ? 'production' : 'development';

module.exports = {
  // the project dir
  context: __dirname,
  entry: './src/index.js',
  target: 'node',
  debug: true,

  resolve: {
    extensions: ['', '.js'],
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    library: 'webpack-google-cloud-storage-plugin',
    libraryTarget: 'umd',
    filename: 'webpack-google-cloud-storage-plugin.js',
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(nodeEnv),
      },
    }),
  ],

  module: {
    preLoaders: [
      {
        test: /\.js?$/,
        loader: 'eslint',
        include: /src/,
        exclude: /node_modules/,
      },
    ],

    loaders: [
      {
        test: /\.js$/,
        include: /src/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
        },
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
    ],
  },
  externals: [
    nodeExternals(
      {
        whitelist: [/^lodash/, '@google-cloud', 'prop-types'],
      }
    ),
  ],
};
