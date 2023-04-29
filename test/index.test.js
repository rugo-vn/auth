import { spawnService } from '@rugo-vn/service';
import { Secure } from '@rugo-vn/shared';
import { expect } from 'chai';

describe('Auth service test', function () {
  let service;
  let lastCall;

  it('should create service', async () => {
    service = await spawnService({
      name: 'auth',
      exec: ['node', 'src/index.js'],
      cwd: './',
      hook(addr, args, opts) {
        lastCall = { addr, args, opts };

        switch (addr) {
          case 'db.create':
            return {
              ...args.data,
            };

          case 'db.find':
            return {
              data: [
                {
                  ...args.cond,
                },
              ],
            };
        }
      },
    });

    await service.start();
  });

  it('should register', async () => {
    const form = { email: 'sample@rugo.vn', password: 'password' };

    const { user } = await service.call('register', {
      data: form,
    });

    expect(lastCall.args.data.creds[0]).to.has.property('key');
    expect(
      Secure.comparePassword(form.password, lastCall.args.data.creds[0].key)
    ).to.be.eq(true);
    expect(user).to.not.has.property('creds');
  });

  it('should login', async () => {
    const form = { email: 'sample@rugo.vn', password: 'password' };

    const { user } = await service.call('login', {
      data: form,
    });

    expect(user).to.not.has.property('creds');
  });

  it('should stop service', async () => {
    await service.stop();
  });
});
