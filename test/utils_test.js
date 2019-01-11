import assert from 'assert';

import { pick } from '../src/utils';


describe('.pick', () => {
  it('returns only keys matching given arguments', () => {
    const obj = {
      a: '1',
      b: '2',
      c: '3',
    };

    const result = pick(obj, 'a');

    assert.deepEqual(
      result,
      {
        a: '1',
      },
    );
  });
});
