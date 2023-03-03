/* eslint-disable */

import bcrypt from 'bcryptjs';
import { assert, expect } from 'chai';
import { createBroker } from '@rugo-vn/service';
import { PASSWORD_SALT } from '../src/utils.js';

const DEMO_USER_DOC = { username: 'foo', password: '123456' };

const dbService = {
  name: 'db',
  actions: {
    async create({ data }) {
      return data;
    },

    async find() {
      return {
        data: [await this.call('db.get')],
      };
    },

    async get() {
      return {
        username: DEMO_USER_DOC.username,
        credentials: [
          {
            type: 'password',
            value: bcrypt.hashSync(DEMO_USER_DOC.password, PASSWORD_SALT),
            perms: [
              { spaceId: 'demo', tableName: 'foo', action: '*', id: '*' },
            ],
          },
        ],
      };
    },
  },
};

describe('Api test', () => {
  let broker;

  beforeEach(async () => {
    broker = createBroker({
      _services: ['./src/index.js'],
      auth: {
        secret: 'thisisasecret',
        spaceId: 'demo',
        tableName: 'foo',
      },
    });

    await broker.loadServices();
    await broker.createService(dbService);
    await broker.start();
  });

  afterEach(async () => {
    await broker.close();
  });

  it('should register', async () => {
    const resp = await broker.call('auth.register', {
      data: {
        ...DEMO_USER_DOC,
        apikey: '441221',
        perms: [{ model: 'users', action: '*' }],
      },
    });

    expect(resp).to.has.property('username', 'foo');
    expect(resp).not.to.has.property('credentials');
  });

  it('should login and gate by password', async () => {
    const resp = await broker.call('auth.login', {
      data: DEMO_USER_DOC,
    });
    expect(resp).to.not.eq(null);

    const resp2 = await broker.call('auth.gate', { token: `Bearer ${resp}` });
    expect(resp2.user).to.has.property('username', 'foo');
    expect(resp2.user).not.to.has.property('credentials');

    const resp3 = await broker.call('auth.gate', {
      token: `Bearer ${resp}`,
      auth: { spaceId: 'demo', tableName: 'foo', action: 'abc' },
    });
    expect(resp3.user).to.has.property('username', 'foo');
    expect(resp3.user).not.to.has.property('credentials');

    try {
      await broker.call('auth.gate', {
        token: `Bearer ${resp}`,
        auth: { spaceId: 'nospace', action: 'abc', id: 'ghi' },
      });
      assert.fail('wrong perm');
    } catch (err) {
      expect(err).to.has.property('message', 'Access Denied');
    }
  });

  it('should wrong token', async () => {
    const resp = await broker.call('auth.gate', { token: `Bearer wrongtoken` });
    expect(resp.user).to.be.eq(null);

    const resp2 = await broker.call('auth.gate', {
      token: `Bearer wrongtoken`,
      perms: [{ spaceId: 'demo', tableName: 'foo', action: '*' }],
      auth: { spaceId: 'demo', tableName: 'foo', action: 'abc' },
    });
    expect(resp2.user).to.be.eq(null);
  });
});
