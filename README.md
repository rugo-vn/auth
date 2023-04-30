# Rugo Auth

Authentication and Authorization.

## OAuth

### Sign In with Google

Follow the guide: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid?hl=en

Then put information into `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in `.env` file.

## Settings

```js
const settings = {
  secret,
  db,
};
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
