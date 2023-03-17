/* eslint-disable */

import { assert, expect } from 'chai';
import { createBroker } from '@rugo-vn/service';
import * as dbService from './db.service.js';

const DEMO_USER_DOC = { username: 'foo', password: '123456' };

describe('Api test', () => {
  let broker;
  let user;

  beforeEach(async () => {
    broker = createBroker({
      _services: ['./src/index.js'],
      auth: {
        secret: 'thisisasecret',
        spaceId: 'demo',
        userTable: 'foo',
        keyTable: 'bar',
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
        credentials: [{ model: 'users', action: '*' }],
      },
    });

    expect(resp).to.has.property('username', 'foo');
    expect(resp).to.has.property('credentials');

    user = resp;
  });

  it('should grant permissions', async () => {
    dbService.db['foo']['1']['credentials'][0].perms = [
      {
        model: 'users',
        action: '*',
      },
    ];
  });

  it('should not login with empty data', async () => {
    try {
      await broker.call('auth.login');
      assert.fail('should throw error');
    } catch (err) {
      expect(err).to.has.property(
        'message',
        'Your identity or password is wrong.'
      );
    }
  });

  it('should login and gate by password', async () => {
    const resp = await broker.call('auth.login', {
      data: DEMO_USER_DOC,
    });
    expect(resp).to.not.eq(null);

    const resp2 = await broker.call('auth.gate', { token: `Bearer ${resp}` });

    expect(resp2).not.to.be.deep.eq({});
    expect(resp2).to.has.property('passport');
    expect(resp2.passport).to.has.property('model');
    expect(resp2.passport).to.has.property('action');

    const resp3 = await broker.call('auth.gate', {
      token: `Bearer ${resp}`,
      info: { action: 'abc' },
    });

    expect(resp3).to.has.property('user');
    expect(resp3).to.has.property('credential');
    expect(resp3).to.has.property('passport');

    try {
      await broker.call('auth.gate', {
        token: `Bearer ${resp}`,
        info: { spaceId: 'nospace', action: 'abc', id: 'ghi' },
      });
      assert.fail('wrong perm');
    } catch (err) {
      expect(err).to.has.property('message', 'Access Denied');
    }
  });

  it('should wrong token', async () => {
    try {
      await broker.call('auth.gate', {
        token: `Bearer wrongtoken`,
      });
      assert.fail('should throw error');
    } catch (err) {
      expect(err).to.has.property(
        'message',
        'Wrong token. Please sign in again.'
      );
    }

    try {
      await broker.call('auth.gate', {
        token: `Bearer wrongtoken`,
        perms: [{ spaceId: 'demo', tableName: 'foo', action: '*' }],
        info: { spaceId: 'demo', tableName: 'foo', action: 'abc' },
      });
      assert.fail('should throw error');
    } catch (err) {
      expect(err).to.has.property(
        'message',
        'Wrong token. Please sign in again.'
      );
    }
  });

  it('should change password', async () => {
    const nextPassword = 'abcdef';
    const resp = await broker.call('auth.changePassword', {
      data: {
        id: user.id,
        currentPassword: DEMO_USER_DOC.password,
        nextPassword,
      },
    });

    DEMO_USER_DOC.password = nextPassword;

    expect(resp).to.be.eq(true);
  });

  it('should login and gate by new password', async () => {
    const resp = await broker.call('auth.login', {
      data: DEMO_USER_DOC,
    });
    expect(resp).to.not.eq(null);

    const resp2 = await broker.call('auth.gate', { token: `Bearer ${resp}` });

    expect(resp2).not.to.be.deep.eq({});
    expect(resp2).to.has.property('passport');
    expect(resp2.passport).to.has.property('model');
    expect(resp2.passport).to.has.property('action');

    const resp3 = await broker.call('auth.gate', {
      token: `Bearer ${resp}`,
      info: { action: 'abc' },
    });

    expect(resp3).to.has.property('user');
    expect(resp3).to.has.property('credential');
    expect(resp3).to.has.property('passport');

    try {
      await broker.call('auth.gate', {
        token: `Bearer ${resp}`,
        info: { spaceId: 'nospace', action: 'abc', id: 'ghi' },
      });
      assert.fail('wrong perm');
    } catch (err) {
      expect(err).to.has.property('message', 'Access Denied');
    }
  });
});
