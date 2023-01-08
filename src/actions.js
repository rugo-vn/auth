import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { ForbiddenError } from '@rugo-vn/exception';
import { PASSWORD_SALT, SecureResp, validatePerm, verifyToken } from './utils.js';

export const register = async function ({ data }) {
  const password = data.password;

  delete data.password;
  delete data.apikey;
  delete data.perms;

  if (password) { data.password = bcrypt.hashSync(password, PASSWORD_SALT); }

  const res = await this.call('db.create', { data, ...this.dbIdentity });
  return SecureResp(res);
};

export const login = async function ({ data }) {
  const password = data.password;

  delete data.password;

  const { data: { 0: user } } = await this.call('db.find', { filters: data, ...this.dbIdentity });

  if (!user) { throw new ForbiddenError('Your identity or password is wrong'); }

  if (!bcrypt.compareSync(password, user.password)) { throw new ForbiddenError('Your identity or password is wrong'); }

  const token = jwt.sign({
    id: user.id
  }, this.secret, {
    expiresIn: '30d'
  });

  return token;
};

export const gate = async function ({ token, auth, perms = [] }) {
  let user;
  if (token) {
    const [authType, authToken] = token.split(' ');

    if (authType === 'Bearer') {
      const rel = await verifyToken(authToken, this.secret);
      if (rel) {
        user = await this.call('db.get', { id: rel.id, ...this.dbIdentity });
      }
    }
  }

  if (!auth)
    return SecureResp(user);

  if (!validatePerm(auth, user?.perms || perms)) { throw new ForbiddenError('Access Denied') }

  return SecureResp(user);
};
