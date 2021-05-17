// NOTE: Taken from https://webpack.github.io/docs/usage.html
const path = require('path');
const WebpackGoogleCloudStoragePlugin = require('../dist/webpack-google-cloud-storage-plugin.js');

module.exports = {
  context: __dirname,
  entry: './src/app.js',

  output: {
    path: './bin',
    filename: 'app.bundle.js',
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        include: /src/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
        },
      },
    ],
  },
  debug: true,
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
        // You can use the metadataFn to set file metadata based on the path:
        // See: https://cloud.google.com/storage/docs/json_api/v1/objects/insert#request_properties_JSON for all
        // options, though cacheControl is likely to be the most relevant:
        metadataFn: (file) => {
          if (/.html$/.test(file.path)) {
            return {
              cacheControl: 'no-store',
            };
          }

          return {
            cacheControl: 'public, max-age=60',
          };
        },
      },
      // Optional, used to invalidate the cache in Google Cloud CDN:
      // See https://cloud.google.com/cdn/docs/invalidating-cached-content#gclou
      cdnCacheInvalidateOptions: {
        // The URL map is likely the name of your Cloud CDN Origin
        // Run `gcloud compute url-maps list` to see a list of your URL maps
        urlMap: 'my-storage-load-balancer',
        // (Optional) If only a certain directory needs to be invalidated, list it here:
        // path: '/*', // This is the default.
        // (Optional) Or if there are multiple paths you want to invalidate:
        // paths: ['/', '/index.html', '/manifest.json'],
      },
    }),
  ],
};
