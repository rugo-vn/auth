/* eslint-disable */

import { expect } from 'chai';

import { BaseComposer, KoaComposer } from "@rugo-vn/common";
import { createGate, createLogin } from '../src/index.js';

import bcrypt from 'bcryptjs';
import { PASSWORD_SALT } from '@rugo-vn/common';

const FakeModel = {
  list(query){
    const successRes = { data: [{ _id: 'demoId', password: bcrypt.hashSync('123456', PASSWORD_SALT) }] };

    if (query.email === 'admin@rugo.vn')
      return successRes;

    if (query.apikey === 'apikey')
      return successRes;

    return { data: [] };
  },

  get(id){
    return id === 'demoId' ? { _id: 'demoId' } : null;
  }
}

describe('Auth test', () => {
  it('should be created login and gate with base composer', async () => {
    const login = createLogin(BaseComposer);

    const res = await login('secret', FakeModel, { email: 'admin@rugo.vn', password: '123456' })();
    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('data');

    const gate = createGate(BaseComposer);
    const context = {};
    const res2 = await gate('secret', FakeModel, false, `Bearer ${res.data}`, context)();
    expect(res2).to.be.eq(null);
    expect(context).to.has.property('rugoUser');

    const context2 = {};
    const res3 = await gate('secret', FakeModel, false, `apikey`, context2)();
    expect(res3).to.be.eq(null);
    expect(context2).to.has.property('rugoUser');

    const context3 = {};
    const res4 = await gate('secret', FakeModel, true, undefined, context3)();
    expect(res4).to.be.eq(null);
    expect(context3).to.not.has.property('rugoUser');
  });

  it('should forbidden and bad request', async () => {
    const login = createLogin(BaseComposer);

    const res = await login('secret', FakeModel, { email: 'noemail', password: '123456' })();
    expect(res).to.has.property('status', 403);
    expect(res).to.has.property('data', 'Wrong email or password');

    const res2 = await login('secret', FakeModel, { password: '123456' })();
    expect(res2).to.has.property('status', 400);
    expect(res2).to.has.property('data', 'Email and Password must not be empty');

    const gate = createGate(BaseComposer);
    const context = {};
    const res3 = await gate('secret', FakeModel, false, `Bearer invalidtoken`, context)();
    expect(res3).to.be.has.property('status', 403);
    expect(res3).to.be.has.property('data', 'Your session has expired. Please logging in again!');
    expect(context).to.not.has.property('rugoUser');

    const context2 = {};
    const res4 = await gate('secret', FakeModel, false, undefined, context2)();
    expect(res4).to.be.has.property('status', 403);
    expect(res4).to.be.has.property('data', 'Access denied');
    expect(context2).to.not.has.property('rugoUser');

    const context3 = {};
    const res5 = await gate('secret', FakeModel, false, ' failapikey', context3)();
    expect(res5).to.be.has.property('status', 403);
    expect(res5).to.be.has.property('data', 'Access denied');
    expect(context3).to.not.has.property('rugoUser');
  });
  
});

