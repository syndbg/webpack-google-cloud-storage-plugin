import Promise from 'bluebird';
import PropTypes from 'prop-types';
import merge from 'lodash.merge';
import gcs from '@google-cloud/storage';
import path from 'path';
import { pick } from './utils';

const recursive = Promise.promisify(require('recursive-readdir'));

const pluginName = 'WebpackGoogleCloudStoragePlugin';

const hook = (compiler, cb) => {
  // new webpack
  if (compiler.hooks) {
    compiler.hooks.afterEmit.tapAsync(pluginName, cb);
    return;
  }
  // old webpack
  compiler.plugin('after-emit', cb);
};

module.exports = class WebpackGoogleCloudStoragePlugin {
  static get schema() {
    return {
      directory: PropTypes.string,
      include: PropTypes.array,
      exclude: PropTypes.array,
      storageOptions: PropTypes.object.isRequired,
      uploadOptions: PropTypes.shape(
        {
          bucketName: PropTypes.string.isRequired,
          forceCreateBucket: PropTypes.bool,
          gzip: PropTypes.bool,
          public: PropTypes.bool,
          destinationNameFn: PropTypes.func,
          makePublic: PropTypes.bool,
          resumable: PropTypes.bool,
        }
      ),
    };
  }

  static get ignoredFiles() {
    return ['.DS_Store'];
  }

  static defaultDestinationNameFn(file) {
    return file.path;
  }

  /**
   * Return an object following this schema:
   * 
   * - https://cloud.google.com/nodejs/docs/reference/storage/2.0.x/Bucket#upload 
   * - https://cloud.google.com/storage/docs/json_api/v1/objects/insert#request_properties_JSON
   * - Example: https://github.com/googleapis/nodejs-storage/blob/master/samples/files.js#L119
   * 
   * @param {*} file { path: string }
   */
  static defaultMetadataFn(file) {
    return {}
  }

  static getAssetFiles({ assets }) {
    const files = assets.map((value, name) => ({ name, path: value.existsAt }));
    return Promise.resolve(files);
  }

  static handleErrors(error, compilation, cb) {
    compilation.errors.push(
      new Error(`${pluginName}: ${error.stack}`)
    );
    cb();
  }

  constructor(options = {}) {
    PropTypes.validateWithErrors(
      this.constructor.schema,
      options,
      pluginName
    );

    this.isConnected = false;

    this.storageOptions = options.storageOptions;
    this.uploadOptions = options.uploadOptions;
    this.uploadOptions.destinationNameFn = this.uploadOptions.destinationNameFn ||
      this.constructor.defaultDestinationNameFn;
    this.uploadOptions.metadataFn = this.uploadOptions.metadataFn ||
      this.constructor.defaultMetadataFn;

    this.options = pick(
      options,
      [
        'directory',
        'include',
        'exclude',
        'basePath',
      ]
    );

    this.options.exclude = this.options.exclude || [];
  }

  connect() {
    if (this.isConnected) {
      return;
    }

    this.client = gcs(
      merge(
        this.storageOptions,
        {
          promise: Promise,
        }
      )
    );

    this.isConnected = true;
  }

  filterFiles(files) {
    return Promise.resolve(
      files.filter(file =>
        this.isIncluded(file.name) &&
        !this.isExcluded(file.name) &&
        !this.isIgnored(file.name)
      )
    );
  }

  isIncluded(fileName) {
    return this.options.include.some(include => fileName.match(new RegExp(include)));
  }

  isExcluded(fileName) {
    return this.options.exclude.some(exclude => fileName.match(new RegExp(exclude)));
  }

  isIgnored(fileName) {
    return this.constructor.ignoredFiles.some(
      ignoredFile => fileName.match(new RegExp(ignoredFile))
    );
  }

  handleFiles(files) {
    return this.filterFiles(files)
      .then(filteredFiles => this.uploadFiles(filteredFiles));
  }

  apply(compiler) {
    this.connect();

    // NOTE: Use specified directory, webpack.config.output or current dir.
    this.options.directory = this.options.directory ||
                             compiler.options.output.path ||
                             compiler.options.output.context ||
                             '.';
    hook(compiler, (compilation, cb) => {
      if (this.options.directory) {
        recursive(this.options.directory, this.options.exclude)
          .then(files => files.map(f => ({ name: path.basename(f), path: f })))
          .then(files => this.handleFiles(files))
          .then(() => cb())
          .catch(e => this.constructor.handleErrors(e, compilation, cb));
      } else {
        this.constructor.getAssetFiles(compilation)
          .then(files => this.handleFiles(files))
          .then(() => cb())
          .catch(e => this.constructor.handleErrors(e, compilation, cb));
      }
    });
  }

  uploadFiles(files = []) {
    const bucket = this.client.bucket(this.uploadOptions.bucketName);
    // see https://hackernoon.com/concurrency-control-in-promises-with-bluebird-977249520f23
    // http://bluebirdjs.com/docs/api/promise.map.html#map-option-concurrency
    return Promise.map(files,
      file =>
      bucket.upload(
        file.path,
        {
          destination: this.uploadOptions.destinationNameFn(file),
          gzip: this.uploadOptions.gzip || false,
          public: this.uploadOptions.makePublic || false,
          resumable: this.uploadOptions.resumable,
        }
      ),
      { concurrency: 10 });
  }
};
