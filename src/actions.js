import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { ForbiddenError } from '@rugo-vn/exception';
import { getPassport } from '@rugo-vn/shared/src/permission.js';
import { SecureResp, verifyToken } from './utils.js';
import { Secure } from '@rugo-vn/shared';

export const register = async function ({ data = {} }) {
  const password = data.password;

  delete data.credentials;
  delete data.password;

  let user = await this.call('db.create', { data, ...this.userTable });

  if (password) {
    const key = await this.call('db.create', {
      data: {
        hash: Secure.hashPassword(password),
        user: user.id,
      },
      ...this.keyTable,
    });

    user = await this.call('db.update', {
      id: user.id,
      set: { credentials: [{ key: key.id }] },
      ...this.userTable,
    });
  }

  return SecureResp(user);
};

export const login = async function ({ data = {} }) {
  const password = data.password;

  delete data.password;
  delete data.apikey;

  if (!password) {
    throw new ForbiddenError('Your identity or password is wrong.');
  }

  const resp = await this.call('db.find', { filters: data, ...this.userTable });
  const {
    data: { 0: user },
  } = resp;

  if (resp.meta.total > 1)
    throw new ForbiddenError('Your identity or password is wrong.');

  if (!user) {
    throw new ForbiddenError('Your identity or password is wrong.');
  }

  if (!user.credentials) {
    throw new ForbiddenError('You do not have any permission to sign in.');
  }

  let valid = false;
  let credential;
  for (const item of user.credentials) {
    if (item.key) {
      const key = await this.call('db.get', { id: item.key, ...this.keyTable });
      if (Secure.comparePassword(password, key.hash)) valid = true;
    }

    if (valid) {
      credential = item;
      break;
    }
  }

  if (!valid) throw new ForbiddenError('Your identity or password is wrong.');

  const token = jwt.sign(
    {
      id: user.id,
      credential,
      version: user.version,
    },
    this.secret,
    {
      expiresIn: '30d',
    }
  );

  return token;
};

export const changePassword = async function ({ data = {} }) {
  const { currentPassword, nextPassword } = data;
  delete data.currentPassword;
  delete data.nextPassword;

  if (!currentPassword || !nextPassword) {
    throw new ForbiddenError(
      'You must provide current password and new password.'
    );
  }

  const resp = await this.call('db.find', { filters: data, ...this.userTable });
  const {
    data: { 0: user },
  } = resp;

  if (resp.meta.total > 1)
    throw new ForbiddenError('Your identity or password is wrong.');

  if (!user) {
    throw new ForbiddenError('Your identity or password is wrong.');
  }

  let valid = false;
  for (const i = 0; i < user.credentials.length; i++) {
    const item = user.credentials[i];
    if (item.key) {
      const key = await this.call('db.get', { id: item.key, ...this.keyTable });
      if (Secure.comparePassword(currentPassword, key.hash)) valid = true;
    }

    if (valid) {
      const nextKey = await this.call('db.create', {
        data: {
          hash: Secure.hashPassword(nextPassword),
          prev: item.key,
          data: Secure.encrypt(currentPassword, nextPassword),
          user: user.id,
        },
        ...this.keyTable,
      });

      await this.call('db.update', {
        id: user.id,
        set: { [`credentials.${i}.key`]: nextKey.id },
        ...this.userTable,
      });
      break;
    }
  }

  if (!valid) throw new ForbiddenError('Your identity or password is wrong.');

  return true;
};

export const gate = async function ({ token, info, perms = [] }) {
  let user, credential;

  if (token) {
    const [authType, authToken] = token.split(' ');

    if (authType === 'Bearer') {
      const rel = await verifyToken(authToken, this.secret);
      if (rel) {
        user = await this.call('db.get', {
          id: rel.id,
          ...this.userTable,
        });

        if (rel.version !== user.version)
          throw new ForbiddenError(
            'Your session is expired. Please sign in again.'
          );

        credential = rel.credential;
        perms = [...perms, ...(rel.credential.perms || [])];
      } else {
        throw new ForbiddenError('Wrong token. Please sign in again.');
      }
    }
  }

  const passport = info ? getPassport(perms, info) : perms[0] || {};

  if (!passport) {
    throw new ForbiddenError('Access Denied');
  }

  return {
    passport,
    user,
    credential,
  };
};
