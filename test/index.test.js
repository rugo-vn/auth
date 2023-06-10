import { spawnService } from '@rugo-vn/service';
import { pack } from '@rugo-vn/service/src/wrap.js';
import { Secure } from '@rugo-vn/shared';
import { hashPassword } from '@rugo-vn/shared/src/secure.js';
import { expect } from 'chai';
import { generateToken } from '../src/methods.js';

const OPTS = {
  userSchema: 'user',
  roleSchema: 'role',
  keySchema: 'key',
};

const SECRET = 'thisisasecret';

describe('Auth service test', function () {
  let service;
  let lastCall;

  it('should create service', async () => {
    service = await spawnService({
      name: 'auth',
      exec: ['node', 'src/index.js'],
      cwd: './',
      async hook(addr, args, opts) {
        lastCall = { addr, args, opts };

        let res;
        switch (`${addr}.${opts.schema}`) {
          case 'db.create.key':
            res = {
              id: 'keyId',
            };
            break;
          case 'db.create.user':
            res = {
              id: 'userId',
              version: 1,
            };
            break;
          case 'db.find.user':
            res = {
              data: [
                {
                  id: 'userId',
                  creds: [{ key: 'keyId', role: 'roleId' }],
                  version: 1,
                },
              ],
            };
            break;
          case 'db.find.key':
            res = {
              data: [
                {
                  id: 'keyId',
                  hash: hashPassword('password'),
                },
              ],
            };
            break;
          case 'db.find.role':
            res = {
              data: [
                {
                  perms: [
                    {
                      a: 1,
                      b: '+',
                      c: '*',
                    },
                  ],
                },
              ],
            };
            break;
        }

        return await pack(() => res);
      },
      settings: { secret: SECRET, db: 'db' },
    });

    await service.start();
  });

  it('should register', async () => {
    const form = { email: 'sample@rugo.vn', password: 'password' };

    const { user, token, perms } = await service.call(
      'register',
      {
        data: form,
      },
      OPTS
    );

    expect(user).to.not.has.property('creds');
    expect(token).to.be.not.eq(undefined);
    expect(perms).to.be.members([]);
  });

  it('should login', async () => {
    const form = { email: 'sample@rugo.vn', password: 'password' };

    const { user, token, perms } = await service.call(
      'login',
      {
        data: form,
      },
      OPTS
    );

    expect(user).to.not.has.property('creds');
    expect(token).to.be.not.eq(undefined);
    expect(perms).to.be.deep.eq([{ a: 1, b: '+', c: '*' }]);
  });

  it('should gate', async () => {
    const { user, perm } = await service.call(
      'gate',
      {
        meta: {
          authorization: `Bearer ${generateToken(
            SECRET,
            { id: 'userId', version: 1 },
            [{ a: 1, b: '+', c: '*' }]
          )}`,
        },
        agent: { a: 1, b: 2 },
      },
      OPTS
    );

    expect(user).to.not.has.property('creds');
    expect(perm).to.be.deep.eq({ a: 1, b: '+', c: '*' });
  });

  it('should stop service', async () => {
    await service.stop();
  });
});
