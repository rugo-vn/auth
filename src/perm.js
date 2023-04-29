import { isNil } from 'ramda';

export function verifyPerm(agent, perm) {
  for (const key in perm) {
    const permValue = perm[key];

    if (permValue === '*') continue;

    if (permValue === '+' && !isNil(agent[key])) continue;

    if (permValue === agent[key]) continue;

    return false;
  }

  return true;
}
