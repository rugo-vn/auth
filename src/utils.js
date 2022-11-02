import jwt from 'jsonwebtoken';

export const PASSWORD_SALT = 10;

export const SecureResp = (doc) => {
  delete doc.password;
  delete doc.apikey;
  delete doc.perms;

  return doc;
};

export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return false;
  }
};

export const validatePerm = (metaPerm, perms) => {
  for (const userPerm of perms) {
    let isMatch = true;

    for (const key in metaPerm) {
      if (userPerm[key] === '*') { continue; }

      if (userPerm[key] === metaPerm[key]) { continue; }

      isMatch = false;
      break;
    }

    if (isMatch) {
      return true;
    }
  }

  return false;
};

export const authSchema = {
  type: 'object',
  properties: {
    password: { type: 'string' },
    apikey: { type: 'string' },
    perms: { type: 'array', items: { type: 'object' } }
  }
};
