'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _lodash = require('lodash.pick');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.merge');

var _lodash4 = _interopRequireDefault(_lodash3);

var _storage = require('@google-cloud/storage');

var _storage2 = _interopRequireDefault(_storage);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var recursive = _bluebird2.default.promisify(require('recursive-readdir'));

var pluginName = 'WebpackGoogleCloudStoragePlugin';
var hook = function hook(compiler, cb) {
  // new webpack
  if (compiler.hooks) {
    compiler.hooks.afterEmit.tapAsync(pluginName, cb);
    return;
  }
  // old webpack
  compiler.plugin('after-emit', cb);
};

module.exports = function () {
  _createClass(WebpackGoogleCloudStoragePlugin, null, [{
    key: 'defaultDestinationNameFn',
    value: function defaultDestinationNameFn(file) {
      return file.path;
    }
  }, {
    key: 'getAssetFiles',
    value: function getAssetFiles(_ref) {
      var assets = _ref.assets;

      var files = assets.map(function (value, name) {
        return { name: name, path: value.existsAt };
      });
      return _bluebird2.default.resolve(files);
    }
  }, {
    key: 'handleErrors',
    value: function handleErrors(error, compilation, cb) {
      compilation.errors.push(new Error(pluginName + ': ' + error.stack));
      cb();
    }
  }, {
    key: 'schema',
    get: function get() {
      return {
        directory: _propTypes2.default.string,
        include: _propTypes2.default.array,
        exclude: _propTypes2.default.array,
        storageOptions: _propTypes2.default.object.isRequired,
        uploadOptions: _propTypes2.default.shape({
          bucketName: _propTypes2.default.string.isRequired,
          forceCreateBucket: _propTypes2.default.bool,
          gzip: _propTypes2.default.bool,
          public: _propTypes2.default.bool,
          destinationNameFn: _propTypes2.default.func,
          makePublic: _propTypes2.default.bool
        })
      };
    }
  }, {
    key: 'ignoredFiles',
    get: function get() {
      return ['.DS_Store'];
    }
  }]);

  function WebpackGoogleCloudStoragePlugin() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, WebpackGoogleCloudStoragePlugin);

    _propTypes2.default.validateWithErrors(this.constructor.schema, options, pluginName);

    this.isConnected = false;

    this.storageOptions = options.storageOptions;
    this.uploadOptions = options.uploadOptions;
    this.uploadOptions.destinationNameFn = this.uploadOptions.destinationNameFn || this.constructor.defaultDestinationNameFn;

    this.options = (0, _lodash2.default)(options, ['directory', 'include', 'exclude', 'basePath']);

    this.options.exclude = this.options.exclude || [];
  }

  _createClass(WebpackGoogleCloudStoragePlugin, [{
    key: 'connect',
    value: function connect() {
      if (this.isConnected) {
        return;
      }

      this.client = (0, _storage2.default)((0, _lodash4.default)(this.storageOptions, {
        promise: _bluebird2.default
      }));

      this.isConnected = true;
    }
  }, {
    key: 'filterFiles',
    value: function filterFiles(files) {
      var _this = this;

      return _bluebird2.default.resolve(files.filter(function (file) {
        return _this.isIncluded(file.name) && !_this.isExcluded(file.name) && !_this.isIgnored(file.name);
      }));
    }
  }, {
    key: 'isIncluded',
    value: function isIncluded(fileName) {
      return this.options.include.some(function (include) {
        return fileName.match(new RegExp(include));
      });
    }
  }, {
    key: 'isExcluded',
    value: function isExcluded(fileName) {
      return this.options.exclude.some(function (exclude) {
        return fileName.match(new RegExp(exclude));
      });
    }
  }, {
    key: 'isIgnored',
    value: function isIgnored(fileName) {
      return this.constructor.ignoredFiles.some(function (ignoredFile) {
        return fileName.match(new RegExp(ignoredFile));
      });
    }
  }, {
    key: 'handleFiles',
    value: function handleFiles(files) {
      var _this2 = this;

      return this.filterFiles(files).then(function (filteredFiles) {
        return _this2.uploadFiles(filteredFiles);
      });
    }
  }, {
    key: 'apply',
    value: function apply(compiler) {
      var _this3 = this;

      this.connect();

      // NOTE: Use specified directory, webpack.config.output or current dir.
      this.options.directory = this.options.directory || compiler.options.output.path || compiler.options.output.context || '.';
      hook(compiler, function (compilation, cb) {
        if (_this3.options.directory) {
          recursive(_this3.options.directory, _this3.options.exclude).then(function (files) {
            return files.map(function (f) {
              return { name: _path2.default.basename(f), path: f };
            });
          }).then(function (files) {
            return _this3.handleFiles(files);
          }).then(function () {
            return cb();
          }).catch(function (e) {
            return _this3.constructor.handleErrors(e, compilation, cb);
          });
        } else {
          _this3.constructor.getAssetFiles(compilation).then(function (files) {
            return _this3.handleFiles(files);
          }).then(function () {
            return cb();
          }).catch(function (e) {
            return _this3.constructor.handleErrors(e, compilation, cb);
          });
        }
      });
    }
  }, {
    key: 'uploadFiles',
    value: function uploadFiles() {
      var _this4 = this;

      var files = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      var bucket = this.client.bucket(this.uploadOptions.bucketName);
      var uploadFiles = files.map(function (file) {
        return bucket.upload(file.path, {
          destination: _this4.uploadOptions.destinationNameFn(file),
          gzip: _this4.uploadOptions.gzip || false,
          public: _this4.uploadOptions.makePublic || false
        });
      });
      return _bluebird2.default.all(uploadFiles);
    }
  }]);

  return WebpackGoogleCloudStoragePlugin;
}();