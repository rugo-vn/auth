/* eslint-disable */

import bcrypt from 'bcryptjs';
import { assert, expect } from 'chai';
import { createBroker } from '@rugo-vn/service';
import { PASSWORD_SALT } from '../src/utils.js';

const DEFAULT_SCHEMA = {
  name: 'auth',
  acls: ['create'],
};

const DEMO_USER_DOC = { username: 'foo', password: '123456' };

const dbService = {
  name: 'db',
  actions: {
    async create({ data }){
      return data;
    },

    async find() {
      return { data: [{ password: bcrypt.hashSync(DEMO_USER_DOC.password, PASSWORD_SALT)}] }
    },

    async get(){
      return {
        ...DEMO_USER_DOC,
        password: bcrypt.hashSync(DEMO_USER_DOC.password, PASSWORD_SALT),
        perms: [
          { spaceId: 'demo', tableName: 'foo', action: '*', id: '*' },
        ]
      };
    }
  },
};

describe('Api test', () => {
  let broker;

  beforeEach(async () => {
    broker = createBroker({
      _services: [
        './src/index.js',
      ],
      auth: {
        secret: 'thisisasecret',
        spaceId: 'demo',
        tableName: 'foo',
      }
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
        perms: [
          { model: 'users', action: '*' },
        ]
      }
    });

    expect(resp).to.has.property('username', 'foo');
  });

  it('should login and gate', async () => {
    const resp = await broker.call('auth.login', {
      data: DEMO_USER_DOC,
    });
    expect(resp).to.not.eq(null);

    const resp2 = await broker.call('auth.gate', { token: `Bearer ${resp}`, });
    expect(resp2).to.has.property('username', 'foo');

    const resp3 = await broker.call('auth.gate', { token: `Bearer ${resp}`, auth: { spaceId: 'demo', tableName: 'foo', action: 'abc' } });
    expect(resp3).to.has.property('username', 'foo');

    try {
      await broker.call('auth.gate', { token: `Bearer ${resp}`, auth: { spaceId: 'nospace', action: 'abc', id: 'ghi' } });
      assert.fail('wrong perm');
    } catch(errs) {
      expect(errs[0]).to.has.property('message', 'Access Denied');
    }
  });

  it('should wrong token', async () => {
    const resp = await broker.call('auth.gate', { token: `Bearer wrongtoken`, });
    expect(resp).to.be.eq(null);

    const resp2 = await broker.call('auth.gate',{
      token: `Bearer wrongtoken`,
      perms: [{ spaceId: 'demo', tableName: 'foo', action: '*' }],
      auth: { spaceId: 'demo', tableName: 'foo', action: 'abc' }
    });
    expect(resp2).to.be.eq(null);
  });
});