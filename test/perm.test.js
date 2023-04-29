import { expect } from 'chai';
import { verifyPerm } from '../src/perm.js';

describe('Perm test', function () {
  it('should valid perm', async () => {
    expect(verifyPerm({ a: 1, b: 2, c: 3 }, { a: 1, b: '+', c: '*' })).to.be.eq(
      true
    );
  });

  it('should invalid perm by missing required factor', async () => {
    expect(verifyPerm({ a: 1, c: 3 }, { a: 1, b: '+', c: '*' })).to.be.eq(
      false
    );
  });

  it('should invalid perm by not match factor', async () => {
    expect(verifyPerm({ a: 2, b: 2, c: 3 }, { a: 1, b: '+', c: '*' })).to.be.eq(
      false
    );
  });
});
