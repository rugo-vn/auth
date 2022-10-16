import { RugoException } from '@rugo-vn/service';
import { path } from 'ramda';

export const name = 'auth';

export * as actions from './actions.js';

export const started = function () {
  this.secret = path(['settings', 'auth', 'secret'], this);
  if (!this.secret) { throw new RugoException('Auth service must have secret string in settings'); }
};
