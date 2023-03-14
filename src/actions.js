import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { ForbiddenError } from '@rugo-vn/exception';
import { getMatchPerm } from '@rugo-vn/shared/src/permission.js';
import { PASSWORD_SALT, SecureResp, verifyToken } from './utils.js';

export const register = async function ({ data }) {
  const password = data.password;

  delete data.credentials;
  delete data.password;

  let user = await this.call('db.create', { data, ...this.userTable });

  if (password) {
    const key = await this.call('db.create', {
      data: {
        hash: bcrypt.hashSync(password, PASSWORD_SALT),
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

export const login = async function ({ data }) {
  const password = data.password;

  delete data.password;
  delete data.apikey;

  const {
    data: { 0: user },
  } = await this.call('db.find', { filters: data, ...this.userTable });

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
      if (bcrypt.compareSync(password, key.hash)) valid = true;
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

export const gate = async function ({ token, info, perms = [] }) {
  if (token) {
    const [authType, authToken] = token.split(' ');

    if (authType === 'Bearer') {
      const rel = await verifyToken(authToken, this.secret);
      if (rel) {
        const user = await this.call('db.get', {
          id: rel.id,
          ...this.userTable,
        });

        if (rel.version !== user.version)
          throw new ForbiddenError(
            'Your session is expired. Please sign in again.'
          );
        perms = [...perms, ...(rel?.credential?.perms || [])];
      }
    }
  }

  if (!info) return {};

  const passport = getMatchPerm(perms, info);

  if (!passport) {
    throw new ForbiddenError('Access Denied');
  }

  return passport;
};
