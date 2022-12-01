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

const modelService = {
  name: 'model',
  actions: {
    async create({ data }){
      return { data };
    },

    async find() {
      return { data: [{ password: bcrypt.hashSync(DEMO_USER_DOC.password, PASSWORD_SALT)}] }
    },

    async get(){
      return { data: {
        ...DEMO_USER_DOC,
        password: bcrypt.hashSync(DEMO_USER_DOC.password, PASSWORD_SALT),
        perms: [
          { model: DEFAULT_SCHEMA.name, action: '*', id: '*' },
        ]
      }};
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
      _globals: {
        [`schema.${DEFAULT_SCHEMA.name}`]: DEFAULT_SCHEMA,
      },
      auth: {
        secret: 'thisisasecret',
        model: DEFAULT_SCHEMA.name,
      }
    });

    await broker.loadServices();
    await broker.createService(modelService);
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

    const resp3 = await broker.call('auth.gate', { token: `Bearer ${resp}`, auth: { model: DEFAULT_SCHEMA.name, action: 'abc' } });
    expect(resp3).to.has.property('username', 'foo');

    const resp4 = await broker.call('auth.gate', { token: `Bearer ${resp}`, auth: { model: 'nomodel', action: 'abc', id: 'ghi' } });
    expect(resp4).to.be.eq(null);
  });

  it('should wrong token', async () => {
    const resp = await broker.call('auth.gate', { token: `Bearer wrongtoken`, });
    expect(resp).to.be.eq(null);
  });
});