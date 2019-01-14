import { expect } from 'chai';

import { pick } from '../src/utils';


describe('.pick', () => {
  it('returns only keys matching given arguments', () => {
    const obj = {
      a: '1',
      b: '2',
      c: '3',
    };

    const result = pick(obj, 'a');

    expect(result).to.deep.equal(
      {
        a: '1',
      },
    );
  });
});
