# Rugo Auth

Authentication and Authorization.

## Overview

It requires `@rugo-vn/db`.

## Settings

```js
const settings = {
  auth: {
    secret: /* secret string, using for encrypt */,
    spaceId: /* space id of users */,
    userTable: /* table name of users */,
    keyTable: /* table name of keys */,
  }
}
```

## Api Key

Called `apikey`, is a special string that allow user gain permission without sign in.

How it made:

`{ ...identity, password }` -> JSON -> encrypt with auth secret -> Base64 String (`apikey`).

## Default

These tables should have following schema:

```js
export const BASE_USER_SCHEMA = {
  properties: {
    credentials: {
      items: {
        key: { type: 'Id' },
      },
    },
  },
};

export const BASE_KEY_SCHEMA = {
  properties: {
    data: { type: 'String' },
    hash: { type: 'String' },
    prev: { type: 'Id' },
    user: { type: 'Id' },
  },
};
```

## Actions

### `register`

Arguments:

- `data` (type: `object`) form data to register.
  - `...` user's information except `credentials`.
  - `password` it will create a new key in `credentials`.

Return:

- (type: `object`) row object of user registerd.

### `login`

Arguments:

- `data` (type: `object`) form data to login, it should have `password`.

Return:

- (type: `string`) JWT token which have payload:
  - `id` user's id
  - `perms` user's permissions

Notes:

- When it check password in credentials, it will match the first password. So, please don't use same password between credentials.

### `gate`

- Parse/check token and get user.
- Validate user's perms.

Arguments:

- `token` or `apikey`
- `info` Auth object for authorization.
- `perms` Default perms when user not existed.

Return:

- (type: `object`)

  - `passport` remain perm's rules that not to check.
  - `credential` current credential of token.
  - `user` user's info of current token.

### `changePassword`

Arguments:

- `data`
  - `...`
  - `currentPassword`
  - `nextPassword`

Return:

- (type: `boolean`)

## License

MIT
