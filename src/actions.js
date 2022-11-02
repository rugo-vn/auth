import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { ForbiddenError } from './exceptions.js';
import { PASSWORD_SALT, SecureResp, validatePerm, verifyToken } from './utils.js';

export const register = async function ({ data, schema, model }) {
  if ((schema._acl || []).indexOf('create') === -1) { throw new ForbiddenError('Not allow to register new user'); }

  const password = data.password;

  delete data.password;
  delete data.apikey;
  delete data.perms;

  if (password) { data.password = bcrypt.hashSync(password, PASSWORD_SALT); }

  const { data: returnData } = await this.call('model.create', { data, name: model });
  return SecureResp(returnData);
};

export const login = async function ({ data, model }) {
  const password = data.password;

  delete data.password;

  const { data: { 0: user } } = await this.call('model.find', { query: data, name: model });

  if (!user) { throw new ForbiddenError('Your identity or password is wrong'); }

  if (!bcrypt.compareSync(password, user.password)) { throw new ForbiddenError('Your identity or password is wrong'); }

  const token = jwt.sign({
    id: user._id
  }, this.secret, {
    expiresIn: '30d'
  });

  return token;
};

export const gate = async function ({ token, apikey, auth, model }) {
  if (!token) { return null; }

  const [authType, authToken] = token.split(' ');

  // validate token
  let user;
  if (authType === 'Bearer') {
    const rel = await verifyToken(authToken, this.secret);
    if (rel) {
      const resp = await this.call('model.get', { id: rel.id, name: model });
      user = resp.data;
    }
  }

  if (!user) { return null; }

  if (!auth) { return SecureResp(user); }

  if (!validatePerm(auth, user.perms || [])) { return null; }

  return SecureResp(user);
};
