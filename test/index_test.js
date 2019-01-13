import assert from 'assert';

import WebpackGoogleCloudStoragePlugin from '../src/index';


describe('WebpackGoogleCloudStoragePlugin', () => {
  describe('.ignoredFiles', () => {
    it("returns array containing exactly only '.DS_Store'", () => {
      const actual = WebpackGoogleCloudStoragePlugin.ignoredFiles;

      assert.deepEqual(actual, ['.DS_Store']);
    });
  });

  describe('.defaultDestinationNameFn', () => {
    context("with object argument that has a 'path' property", () => {
      it("returns the 'path' property", () => {
        const obj = {
          path: '/tmp/example',
        };

        const actual = WebpackGoogleCloudStoragePlugin.defaultDestinationNameFn(obj);

        assert.equal(actual, '/tmp/example');
      });
    });

    context("with object argument that has no 'path' property", () => {
      it('returns undefined', () => {
        const obj = {};

        const actual = WebpackGoogleCloudStoragePlugin.defaultDestinationNameFn(obj);

        assert.equal(actual, undefined);
      });
    });

    context('with non-object argument', () => {
      it('returns undefined', () => {
        const argument = 5;
        const actual = WebpackGoogleCloudStoragePlugin.defaultDestinationNameFn(argument);

        assert.equal(actual, undefined);
      });
    });
  });

  describe('.defaultMetadataFn', () => {
    it('returns an empty object', () => {
      const actual = WebpackGoogleCloudStoragePlugin.defaultMetadataFn();

      assert.deepEqual(actual, {});
    });
  });
});
