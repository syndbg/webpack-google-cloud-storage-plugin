import { expect } from 'chai';

import WebpackGoogleCloudStoragePlugin from '../src/index';


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
          .then(actual => assert.deepEqual(actual, expected))
          .finally(done);
      });
    });

    context("with object that has an 'assets' property that's empty", () => {
      it('returns Promise with resolved empty array', (done) => {
        const expected = [];
        const argument = { assets: [] };
        const result = WebpackGoogleCloudStoragePlugin.getAssetFiles(argument);

        result
          .then(actual => assert.deepEqual(actual, expected))
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
        const actual = new WebpackGoogleCloudStoragePlugin(localOptions);

        expect(actual.uploadOptions).to.deep.equal(
          {
            bucketName: "examplebucket",
            destinationNameFn: localOptions.uploadOptions.destinationNameFn,
            metadataFn: localOptions.uploadOptions.metadataFn,
            concurrency: 5,
            gzip: true,
            makePublic: true,
          },
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
    });
  });
});
