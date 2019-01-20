import { expect } from 'chai';

import WebpackGoogleCloudStoragePlugin from '../src/index';
// NOTE: Import like this to work-around mocking of ES6 modules with default export function.
import * as GoogleCloudStorage from '@google-cloud/storage';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import { Promise as BluebirdPromise } from 'bluebird';


describe('WebpackGoogleCloudStoragePlugin', () => {
  describe('.ignoredFiles', () => {
    it("returns array containing exactly only '.DS_Store'", () => {
      const actual = WebpackGoogleCloudStoragePlugin.ignoredFiles;

      expect(actual).to.deep.equal(['.DS_Store']);
    });
  });

  describe('.defaultDestinationNameFn', () => {
    context("with object argument that has a 'path' property", () => {
      it("returns the 'path' property", () => {
        const obj = {
          path: '/tmp/example',
        };

        const actual = WebpackGoogleCloudStoragePlugin.defaultDestinationNameFn(obj);

        expect(actual).to.equal('/tmp/example');
      });
    });

    context("with object argument that has no 'path' property", () => {
      it('returns undefined', () => {
        const obj = {};

        const actual = WebpackGoogleCloudStoragePlugin.defaultDestinationNameFn(obj);

        expect(actual).to.equal(undefined);
      });
    });

    context('with non-object argument', () => {
      it('returns undefined', () => {
        const argument = 5;
        const actual = WebpackGoogleCloudStoragePlugin.defaultDestinationNameFn(argument);

        expect(actual).to.equal(undefined);
      });
    });
  });

  describe('.defaultMetadataFn', () => {
    it('returns an empty object', () => {
      const actual = WebpackGoogleCloudStoragePlugin.defaultMetadataFn();

      expect(actual).to.deep.equal({});
    });
  });

  describe('.getAssetFiles', () => {
    context("with object that has an 'assets' property containing multiple objects with 'name' and 'existsAt' properties", () => {
      class FakeAssets {
        constructor(data) {
          this.data = data;
        }

        map(fn) {
          const mapped = [];
          this.data.forEach(
            obj => mapped.push(
              fn(obj, obj.name)
            )
          );

          return mapped;
        }
      }

      it("returns Promise with resolved array of 'name' and 'path' objects", (done) => {
        const fakeAssets = new FakeAssets();
        fakeAssets.data = [
          { name: 'foo', existsAt: '/tmp/foo', missing: 1 },
          { name: 'foobar', existsAt: '/tmp/foobar', missing: 2 },
          { name: 'bar', existsAt: '/tmp/bar', missing: 3 },
        ];

        const expected = [
          { name: 'foo', path: '/tmp/foo' },
          { name: 'foobar', path: '/tmp/foobar' },
          { name: 'bar', path: '/tmp/bar' },
        ];
        const argument = { assets: fakeAssets };
        const result = WebpackGoogleCloudStoragePlugin.getAssetFiles(argument);

        result
          .then(actual => expect(actual).to.deep.equal(expected))
          .finally(done);
      });
    });

    context("with object that has an 'assets' property that's empty", () => {
      it('returns Promise with resolved empty array', (done) => {
        const expected = [];
        const argument = { assets: [] };
        const result = WebpackGoogleCloudStoragePlugin.getAssetFiles(argument);

        result
          .then(actual => expect(actual).to.deep.equal(expected))
          .finally(done);
      });
    });
  });

  describe('.handleErrors', () => {
    class FakeCompilation {
      constructor() {
        this.errors = [];
      }
    }

    class FakeError {
      constructor(stack) {
        this.stack = stack;
      }
    }

    it("adds the error to the aggregated 'compilation.errors' and invokes the given callback 'cb'", () => {
      const fakeCompilation = new FakeCompilation();
      const fakeError = new FakeError('my stack');
      let cbCalled = false;

      const fakeCb = () => {
        cbCalled = true;
      };

      WebpackGoogleCloudStoragePlugin.handleErrors(fakeError, fakeCompilation, fakeCb);

      expect(cbCalled).to.equal(true);
      expect(fakeCompilation.errors.length).to.equal(1);
      expect(fakeCompilation.errors[0].message).to.equal('WebpackGoogleCloudStoragePlugin: my stack');
      expect(fakeCompilation.errors[0]).to.be.instanceOf(Error);
    });
  });

  describe('constructor', () => {
    context("with 'directory' that is not a string in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          directory: 1,
          storageOptions: {},
          uploadOptions: {},
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        ).to.throw("Invalid prop `directory` of type `number` supplied to `WebpackGoogleCloudStoragePlugin`, expected `string`.");
      });
    });

    context("with 'include' that is not an array in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          include: 1,
          storageOptions: {},
          uploadOptions: {},
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        ).to.throw("Invalid prop `include` of type `number` supplied to `WebpackGoogleCloudStoragePlugin`, expected `array`.");
      });
    });

    context("with 'exclude' that is not an array in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          exclude: 1,
          storageOptions: {},
          uploadOptions: {},
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        ).to.throw("Invalid prop `exclude` of type `number` supplied to `WebpackGoogleCloudStoragePlugin`, expected `array`.");
      });
    });

    context("with 'storageOptions' that is not an object in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          storageOptions: [],
          uploadOptions: {},
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        ).to.throw("Invalid prop `storageOptions` of type `array` supplied to `WebpackGoogleCloudStoragePlugin`, expected `object`.");
      });
    });

    context("with 'uploadOptions' that is not an object in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          storageOptions: {},
          uploadOptions: [],
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        ).to.throw("Invalid prop `uploadOptions` of type `array` supplied to `WebpackGoogleCloudStoragePlugin`, expected `object`.");
      });
    });

    context("with 'uploadOptions.bucketName' that is not a string in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          storageOptions: {},
          uploadOptions: {
            bucketName: 1,
          },
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        ).to.throw("Invalid prop `bucketName` of type `number` supplied to `WebpackGoogleCloudStoragePlugin`, expected `string`.");
      });
    });

    context("with 'uploadOptions.gzip' that is not a bool in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          storageOptions: {},
          uploadOptions: {
            bucketName: "example",
            gzip: 5,
          },
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        ).to.throw("Invalid prop `gzip` of type `number` supplied to `WebpackGoogleCloudStoragePlugin`, expected `boolean`.");
      });
    });

    context("with 'uploadOptions.makePublic' that is not a bool in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          storageOptions: {},
          uploadOptions: {
            bucketName: "example",
            makePublic: 5,
          },
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        ).to.throw("Invalid prop `makePublic` of type `number` supplied to `WebpackGoogleCloudStoragePlugin`, expected `boolean`.");
      });
    });

    context("with 'uploadOptions.destinationNameFn' that is not a func in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          storageOptions: {},
          uploadOptions: {
            bucketName: "example",
            destinationNameFn: "function",
          },
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        ).to.throw("Invalid prop `destinationNameFn` of type `string` supplied to `WebpackGoogleCloudStoragePlugin`, expected `function`.");
      });
    });

    context("with 'uploadOptions.destinationNameFn' that is not a func in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          storageOptions: {},
          uploadOptions: {
            bucketName: "example",
            destinationNameFn: "function",
          },
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        ).to.throw("Invalid prop `destinationNameFn` of type `string` supplied to `WebpackGoogleCloudStoragePlugin`, expected `function`.");
      });
    });

    context("with missing 'storageOptions' in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          uploadOptions: {
            bucketName: 'testbucket',
          }
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        )
          .to
          .throw("Required prop `storageOptions` was not specified in `WebpackGoogleCloudStoragePlugin`.");
      });
    });

    context("with missing 'uploadOptions' in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          storageOptions: {},
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        )
        .to
        .throw("Required prop `uploadOptions` was not specified in `WebpackGoogleCloudStoragePlugin`.");
      });
    });

    context("with missing 'uploadOptions.bucketName' in 'options' argument", () => {
      it("returns error", () => {
        const options = {
          storageOptions: {},
          uploadOptions: {},
        };

        expect(
          () => new WebpackGoogleCloudStoragePlugin(options)
        )
          .to
          .throw("Required prop `bucketName` was not specified in `WebpackGoogleCloudStoragePlugin`.");
      });
    });

    context("with present 'storageOptions' and 'uploadOptions.bucketName' in 'options' argument", () => {
      const options = {
        storageOptions: {
          projectId: 'grape-spaceship-123',
        },
        uploadOptions: {
          bucketName: 'examplebucket',
        },
      };

      it("sets 'isConnected' to false by default", () => {
        const localOptions = Object.assign({}, options);
        const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

        expect(actual.isConnected).to.equal(false);
      });

      it("sets 'storageOptions' to given options' 'storageOptions'", () => {
        const localOptions = Object.assign({}, options);
        const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

        expect(actual.storageOptions).to.deep.equal({ projectId: 'grape-spaceship-123' });
      });

      it("sets 'uploadOptions' to given options' 'uploadOptions'", () => {
        const localOptions = Object.assign({}, options);
        localOptions.uploadOptions.destinationNameFn = file => file;
        localOptions.uploadOptions.metadataFn = file => {};
        localOptions.uploadOptions.gzip = true;
        localOptions.uploadOptions.makePublic = true;
        localOptions.uploadOptions.concurrency = 5;
        localOptions.uploadOptions.resumable = false;
        const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

        expect(actual.uploadOptions).to.deep.equal(
          {
            bucketName: "examplebucket",
            destinationNameFn: localOptions.uploadOptions.destinationNameFn,
            metadataFn: localOptions.uploadOptions.metadataFn,
            concurrency: 5,
            gzip: true,
            makePublic: true,
            resumable: false,
          }
        );
      });

      it("sets 'options' to given 'options.{directory,include,exclude,basePath}", () => {
        const localOptions = Object.assign({}, options);
        localOptions.directory = "/tmp/example";
        localOptions.include = ["a", "b", "c"];
        localOptions.exclude = ["d", "e", "f"];
        localOptions.basePath = "/home/user/project/example";

        const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

        expect(actual.options).to.deep.equal(
          {
            directory: localOptions.directory,
            include: localOptions.include,
            exclude: localOptions.exclude,
            basePath: localOptions.basePath,
          },
        );
      });

      context("without 'options.include' provided in 'options' argument'", () => {
        it("sets 'options.include' to empty array", () => {
          const localOptions = Object.assign({}, options);
          localOptions.directory = "/tmp/example";
          delete localOptions.include;
          localOptions.exclude = ["d", "e", "f"];
          localOptions.basePath = "/home/user/project/example";

          const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

          expect(actual.options).to.deep.equal(
            {
              directory: localOptions.directory,
              include: [],
              exclude: localOptions.exclude,
              basePath: localOptions.basePath,
            }
          );
        });
      });

      context("without 'options.exclude' provided in 'options' argument'", () => {
        it("sets 'options.exclude' to empty array", () => {
          const localOptions = Object.assign({}, options);
          localOptions.directory = "/tmp/example";
          localOptions.include = ["a", "b", "c"];
          delete localOptions.exclude;
          localOptions.basePath = "/home/user/project/example";

          const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

          expect(actual.options).to.deep.equal(
            {
              directory: localOptions.directory,
              include: localOptions.include,
              exclude: [],
              basePath: localOptions.basePath,
            }
          );
        });
      });

      context("without 'uploadOptions.destinationNameFn' provided in 'options' argument", () => {
        it("sets 'uploadOptions' to given options 'uploadOptions' and uses 'defaultDestinationNameFn'", () => {
          const localOptions = Object.assign({}, options);
          delete localOptions.uploadOptions.destinationNameFn;
          const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

          expect(
            actual.uploadOptions.destinationNameFn
          ).to.deep.equal(actual.constructor.defaultDestinationNameFn);
        });
      });

      context("without 'uploadOptions.metadataFn' provided in 'options' argument", () => {
        it("sets 'uploadOptions' to given options 'uploadOptions' and uses 'defaultMetadataFn'", () => {
          const localOptions = Object.assign({}, options);
          delete localOptions.uploadOptions.metadataFn;
          const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

          expect(
            actual.uploadOptions.metadataFn
          ).to.deep.equal(actual.constructor.defaultMetadataFn);
        });
      });

      context("without 'uploadOptions.gzip' provided in 'options' argument", () => {
        it("sets 'uploadOptions.gzip' to false", () => {
          const localOptions = Object.assign({}, options);
          delete localOptions.uploadOptions.gzip;
          const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

          expect(actual.uploadOptions.gzip).to.equal(false);
        });
      });

      context("without 'uploadOptions.makePublic' provided in 'options' argument", () => {
        it("sets 'uploadOptions.makePublic' to false", () => {
          const localOptions = Object.assign({}, options);
          delete localOptions.uploadOptions.makePublic;
          const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

          expect(actual.uploadOptions.makePublic).to.equal(false);
        });
      });

      context("without 'uploadOptions.concurrency' provided in 'options' argument", () => {
        it("sets 'uploadOptions.concurrency' to 10", () => {
          const localOptions = Object.assign({}, options);
          delete localOptions.uploadOptions.concurrency;
          const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

          expect(actual.uploadOptions.concurrency).to.equal(10);
        });
      });

      context("without 'uploadOptions.resumable' provided in 'options' argument", () => {
        it("sets 'uploadOptions.resumable' to true", () => {
          const localOptions = Object.assign({}, options);
          delete localOptions.uploadOptions.resumable;
          const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

          expect(actual.uploadOptions.resumable).to.equal(true);
        });
      });
    });
  });

  describe('#connect', () => {
    context("with 'isConnected = false'", () => {
      const options = {
        storageOptions: {},
        uploadOptions: {
          bucketName: 'examplebucket',
        },
      };

      it("creates a GoogleCloudStorage client with 'options.storageOptions' and Bluebird Promise as 'promise' option", () => {
        const googleCloudStorageStub = sinon.spy(() => sinon.createStubInstance(GoogleCloudStorage.default));
        const mockedWebpackGoogleCloudStoragePlugin = proxyquire(
          '../src/index',
          {
            '@google-cloud/storage' : googleCloudStorageStub,
          },
        );

        const plugin = new mockedWebpackGoogleCloudStoragePlugin(options);
        plugin.connect();

        expect(plugin.client).to.be.instanceOf(GoogleCloudStorage.default);
        expect(googleCloudStorageStub.called).to.equal(true);
        expect(googleCloudStorageStub.callCount).to.equal(1);

        const expectCallArgs = Object.assign({}, options.storageOptions);
        expectCallArgs.promise = BluebirdPromise;

        expect(googleCloudStorageStub.getCall(0).args[0]).to.deep.equal(expectCallArgs);
      });
    });

    context("with 'isConnected = true'", () => {
      const options = {
        storageOptions: {},
        uploadOptions: {
          bucketName: 'examplebucket',
        },
      };

      class fakeGcs {
        constructor() {
          this.isFake = true;
        }
      }

      const plugin = new WebpackGoogleCloudStoragePlugin(options);
      plugin.isConnected = true;
      plugin.client = new fakeGcs();

      it('does not create a new client', () => {
        expect(plugin.client).to.be.instanceOf(fakeGcs);

        plugin.connect();

        expect(plugin.client).to.be.instanceOf(fakeGcs);
        expect(plugin.client.isFake).to.eq(true);
      });
    });
  });
});
