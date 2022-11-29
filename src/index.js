import { RugoException } from '@rugo-vn/exception';
import { path } from 'ramda';

export const name = 'auth';

export * as actions from './actions.js';
export * as hooks from './hooks.js';

export const started = function () {
  this.secret = path(['settings', 'auth', 'secret'], this);
  this.model = path(['settings', 'auth', 'model'], this);

  if (!this.secret) { throw new RugoException('Auth service must have secret string in settings'); }
  if (!this.model) { throw new RugoException('Auth service must have model name in settings'); }
};
