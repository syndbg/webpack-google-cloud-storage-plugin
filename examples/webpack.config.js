// NOTE: Taken from https://webpack.github.io/docs/usage.html
const path = require('path');
const WebpackGoogleCloudStoragePlugin = require('webpack-google-cloud-storage-plugin');

module.exports = {
  context: __dirname,
  entry: './src/app.js',

  output: {
    path: path.resolve('./bin'),
    filename: 'app.bundle.js',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        include: /src/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        },
      },
    ],
  },
  plugins: [
    new WebpackGoogleCloudStoragePlugin({
      directory: './src',
      // NOTE: Array of filename strings (or regex) to include in the uploading process
      include: ['.js'],
      // NOTE: Array of filename strings (or regex) to exclude in the uploading process
      exclude: ['cats.js'],
      // NOTE: Options passed directly to
      // Google cloud Node Storage client.
      // This is mostly authentication-wise.
      // For more information:
      // https://github.com/GoogleCloudPlatform/google-cloud-node/tree/master/packages/storage#authentication
      storageOptions: {
        projectId: 'grape-spaceship-123',
        // keyFilename: '/path/to/keyfile.json'
        // keyFileName: './examples/my-credentials.json',
        // key: 'mykey',
        // credentials: require('/path/to/credentials.json'),
      },
      // NOTE: Options used by
      // WebpackGoogleCloudStoragePlugin
      // regarding uploading.
      uploadOptions: {
        // Where to upload files
        bucketName: 'my-bucket-name',
        // Whether to create the bucket if it doesn't exist already
        // default: false
        // NOTE: Currently not tested and most likely not working.
        forceCreateBucket: false,
        // NOTE: Prefix to add in the bucket file path.
        // E.g: app.js => assets/v1/app.js,
        // file is an object with { name:, path: }.
        destinationNameFn: file =>
           path.join('assets', file.path)
        ,
      },
    }),
  ],
};
