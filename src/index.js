import { RugoException } from '@rugo-vn/exception';
import { path } from 'ramda';

export const name = 'auth';

export * as actions from './actions.js';

export const started = function () {
  this.secret = path(['settings', 'auth', 'secret'], this);

  const spaceId = path(['settings', 'auth', 'spaceId'], this);
  const tableName = path(['settings', 'auth', 'tableName'], this);

  if (!this.secret) {
    throw new RugoException('Auth service must have secret string in settings');
  }
  if (!spaceId || !tableName) {
    throw new RugoException(
      'Auth service must have spaceId and modelName in settings'
    );
  }

  this.dbIdentity = {
    spaceId,
    tableName,
  };
};
