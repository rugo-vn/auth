/* eslint-disable */

import bcrypt from 'bcryptjs';
import { expect } from 'chai';
import { createBroker } from '@rugo-vn/service';
import { PASSWORD_SALT } from '../src/utils.js';

const DEFAULT_SCHEMA = {
  _name: 'auth',
  _acl: ['create'],
};

const DEFAULT_SETTINGS = {
  model: DEFAULT_SCHEMA._name,
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
      return { data: { ...DEMO_USER_DOC, password: bcrypt.hashSync(DEMO_USER_DOC.password, PASSWORD_SALT)} };
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
        [`schema.${DEFAULT_SCHEMA._name}`]: DEFAULT_SCHEMA,
      },
      auth: {
        secret: 'thisisasecret',
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
      },
      ...DEFAULT_SETTINGS }
    );

    expect(resp).to.has.property('username', 'foo');
  });

  it('should login and gate', async () => {
    const resp = await broker.call('auth.login', {
      data: DEMO_USER_DOC,
      ...DEFAULT_SETTINGS,
    });
    expect(resp).to.not.eq(null);

    const resp2 = await broker.call('auth.gate', { token: `Bearer ${resp}`, ...DEFAULT_SETTINGS, });
    expect(resp2).to.has.property('username', 'foo');
  });
});