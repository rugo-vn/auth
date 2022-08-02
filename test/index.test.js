/* eslint-disable */

import bcrypt from 'bcryptjs';
import { expect } from 'chai';
import { ServiceBroker } from 'moleculer';
import { mergeDeepRight } from 'ramda';

import * as authService from '../src/index.js';

const TEST_EMAIL = 'test@email.com';
const TEST_PHONE = '0123456789';
const TEST_PASSWORD = 'thisisasecretstring';
const FAIL_PASSWORD = 'failpassword';
const TEST_ID = 'thisisanid';
const TEST_SETTINGS = {
  meta: {
    authSchema: {
      name: 'users',
      driver: 'mem',
      properties: {},
      identities: ['email', 'phone']
    }
  }
}

const modelService = {
  name: 'model',
  actions: {
    async get({ params }){
      if (params.id === TEST_ID)
        return { status: 'success', data: {
          perms: [
            { 'foo': 'bar', 'abc': 'def' },
            { 'foo': 'bar', 'sth': 'sbd', 'ghi': '*'}
          ]
        }};
        
      return { status: 'success', data: null };
    },

    async find({ params }){
      const { filters } = params;

      if (filters.email === TEST_EMAIL || filters.phone === TEST_PHONE){
        return {
          status: 'success',
          data: [
            {
              _id: TEST_ID,
              password: bcrypt.hashSync(TEST_PASSWORD, 10)
            }
          ]
        }
      }

      return {
        status: 'success',
        data: []
      };
    }
  }
}

describe('Auth service test', () => {
  let broker;

  beforeEach(async () => {
    broker = new ServiceBroker();

    broker.createService(modelService);
    broker.createService(mergeDeepRight(authService, {
      settings: { secret: 'jwtsecret' }
    }));

    await broker.start();
  });

  afterEach(async () => {
    await broker.stop();
  });

  it('should be login', async () => {
    const res = await broker.call('auth.login', { form: {
      identity: TEST_EMAIL,
      password: TEST_PASSWORD
    } }, TEST_SETTINGS);

    expect(res).to.has.property('status', 200);
    expect(res.body).to.has.property('status', 'success');
    expect(res.body).to.has.property('data');

    const res2 = await broker.call('auth.login', { form: {
      identity: TEST_PHONE,
      password: TEST_PASSWORD
    } }, TEST_SETTINGS);

    expect(res2).to.has.property('status', 200);
    expect(res2.body).to.has.property('status', 'success');
    expect(res2.body).to.has.property('data');

    const res3 = await broker.call(
      'auth.gate', 
      { headers: { authorization: `Bearer ${res2.body.data}` } }, 
      mergeDeepRight(TEST_SETTINGS, {
        meta: {
          perm: { foo: 'bar', ghi: 'demo' }
        }
      })
    );

    expect(res3).to.be.eq(null);
  });

  it('should be not login', async () => {
    const res = await broker.call('auth.login', { form: {
      identity: TEST_EMAIL,
      password: FAIL_PASSWORD
    } }, TEST_SETTINGS);

    expect(res).to.has.property('status', 403);
    expect(res.body).to.has.property('status', 'error');
    expect(res.body.data[0]).to.has.property('message', 'forbidden');

    // invalid token
    const res2 = await broker.call(
      'auth.gate', 
      { headers: { authorization: `Bearer wrongtoken` } }, 
      mergeDeepRight(TEST_SETTINGS, {
        meta: {
          perm: { ghi: 'demo', abc: 'def' }
        }
      })
    );

    expect(res2).to.has.property('status', 403);
    expect(res2.body).to.has.property('status', 'error');
    expect(res2.body.data[0]).to.has.property('message', 'forbidden');

    // invalid perm
    const res3 = await broker.call('auth.login', { form: {
      identity: TEST_PHONE,
      password: TEST_PASSWORD
    } }, TEST_SETTINGS);

    const res4 = await broker.call(
      'auth.gate', 
      { headers: { authorization: `Bearer ${res3.body.data}` } }, 
      mergeDeepRight(TEST_SETTINGS, {
        meta: {
          perm: { ghi: 'demo', abc: 'def' }
        }
      })
    );

    expect(res4).to.has.property('status', 403);
    expect(res4.body).to.has.property('status', 'error');
    expect(res4.body.data[0]).to.has.property('message', 'forbidden');
  });
});