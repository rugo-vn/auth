import jwt from 'jsonwebtoken';

export function generateToken(secret, user, perms = []) {
  return jwt.sign(
    {
      id: user.id,
      version: user.version,
      perms,
    },
    secret,
    {
      expiresIn: '30d',
    }
  );
}

export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return false;
  }
};
