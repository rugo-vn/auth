import { defineAction } from '@rugo-vn/service';
import { Secure } from '@rugo-vn/shared';
import { generateToken, verifyToken } from './methods.js';
import { verifyPerm } from './perm.js';

let secret, db;

defineAction('start', async function (settings) {
  secret = settings.secret;
  db = settings.db;

  if (!secret)
    throw new Error('Auth service must have secret string in settings');

  if (!db) throw new Error('Auth service must have db in settings');
});

defineAction('register', async function ({ data }, { userSchema }) {
  const { email, password } = data;

  // create user
  const user = await this.call(
    `${db}.create`,
    {
      data: { email, creds: [{ key: Secure.hashPassword(password) }] },
    },
    { schema: userSchema }
  );

  // return
  delete user.creds;
  const perms = [];
  return { user, token: generateToken(secret, user, perms), perms };
});

defineAction('login', async function ({ data }, { userSchema, roleSchema }) {
  const { email, password } = data;

  // find user
  const user = (
    await this.call(`${db}.find`, { cond: { email } }, { schema: userSchema })
  ).data[0];
  if (!user) throw new Error('Your identity or password is wrong.');

  // verify password
  let cred;
  for (const item of user.creds) {
    if (item.key) {
      if (Secure.comparePassword(password, item.key)) {
        cred = item;
        break;
      }
    }
  }
  if (!cred) throw new Error('Your identity or password is wrong.');

  // get perms
  const perms = cred.role
    ? (await this.call(`${db}.find`, { id: cred.role }, { schema: roleSchema }))
        .data[0]?.perms || []
    : [];

  // return
  delete user.creds;
  return { user, token: generateToken(secret, user, perms), perms };
});

defineAction('gate', async function ({ meta = {}, agent }, opts) {
  const { authorization: token = '' } = meta;
  const { userSchema } = opts;
  const [authType, authToken] = token.split(' ');
  let perms = opts.perms || [];

  // get perms from token
  let user;
  if (token && authType === 'Bearer') {
    const rel = await verifyToken(authToken, secret);
    if (rel) {
      user = (
        await this.call(
          'db.find',
          {
            id: rel.id,
          },
          { schema: userSchema }
        )
      ).data[0];

      if (!user) throw new Error('User is not exist');
      delete user.creds;

      if (rel.version !== user.version)
        throw new Error('Your session is expired. Please sign in again.');

      perms = [...perms, ...rel.perms];
    } else {
      throw new Error('Wrong token. Please sign in again.');
    }
  }

  // validate perms
  let valid = agent ? false : true;
  for (const perm of perms) {
    if (verifyPerm(agent, perm)) {
      valid = true;
      break;
    }
  }

  if (!valid) throw new Error('Access Denied');

  return {
    user,
    perms,
  };
});
