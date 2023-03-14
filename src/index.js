import { RugoException } from '@rugo-vn/exception';
import { path } from 'ramda';

export const name = 'auth';

export * as actions from './actions.js';

export const started = function () {
  this.secret = path(['settings', 'auth', 'secret'], this);

  const spaceId = path(['settings', 'auth', 'spaceId'], this);
  const userTable = path(['settings', 'auth', 'userTable'], this);
  const keyTable = path(['settings', 'auth', 'keyTable'], this);

  if (!this.secret) {
    throw new RugoException('Auth service must have secret string in settings');
  }
  if (!spaceId || !userTable || !keyTable) {
    throw new RugoException(
      'Auth service must have spaceId, userTable and keyTable in settings'
    );
  }

  this.userTable = {
    spaceId,
    tableName: userTable,
  };

  this.keyTable = {
    spaceId,
    tableName: keyTable,
  };
};
