# webpack-google-cloud-storage-plugin

[![npm version](https://badge.fury.io/js/webpack-google-cloud-storage-plugin.svg)](https://badge.fury.io/js/webpack-google-cloud-storage-plugin)

A Webpack plugin to upload assets in Google Cloud Storage.

## Installation

`npm install --save webpack-google-cloud-storage-plugin`

## Usage

```JavaScript
// In your webpack.config.js
import WebpackGoogleCloudStoragePlugin from 'webpack-google-cloud-storage-plugin';

module.exports = {
  ...
  plugins: [
    new WebpackGoogleCloudStoragePlugin({
      directory: './src',
      // NOTE: Array of regexes matching filenames to include in the uploading process
      include: ['app.js'],
      // NOTE: Array of regexes matching filenames to exclude in the uploading process
      exclude: ['cats.js'],
      // NOTE: Options passed directly to Google cloud Node Storage client. This is 
      // mostly for authentication-wise. For more information:
      // https://github.com/GoogleCloudPlatform/google-cloud-node/tree/master/packages/storage#authentication
      storageOptions: {
        // projectId is optional if you specify a keyFilename
        projectId: 'grape-spaceship-123',
        // keyFilename: '/path/to/keyfile.json'
        // keyFilename: './examples/my-credentials.json', // note: Filename, not FileName
        // key: 'mykey',
        // credentials: require('/path/to/credentials.json'),
      },
      // NOTE: Options used by
      // WebpackGoogleCloudStoragePlugin
      // regarding uploading.
      uploadOptions: {
        // Where to upload files
        bucketName: 'my-bucket-name',
        // NOTE: Prefix to add in the bucket file path.
        // E.g: app.js => assets/v1/app.js,
        // file is an object with { name:, path: }.
        destinationNameFn: file =>
           path.join('assets', file.path)
        ,
        // Available properties in returned object are defined here;
        // https://cloud.google.com/storage/docs/json_api/v1/objects/insert#request_properties_JSON
        // It will be passed into 'upload' here:
        // https://github.com/googleapis/nodejs-storage/blob/master/samples/files.js#L116
        metadataFn: file => ({
          // cache it a little longer!
          cacheControl: 'public, max-age=31536000',
        }),
        // Make gzip compressed (default: false)
        gzip: true,
        // Make file public (default: false)
        makePublic: true,
        // Resumable upload (default: true)
        // https://cloud.google.com/storage/docs/json_api/v1/how-tos/resumable-upload
        resumable: true,
        // Concurrency ratio when uploading files (default: 10)
        concurrency: 5,
      },
    }),
  ],
};
```
## Examples

Check out the examples folder for a working demo.

Add your credentials to `storageOptions` and set `uploadOptions`.

Then you can run the demo webpack using `npm run example`.
