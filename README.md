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
    tableName: /* table name of users */,
  }
}
```

## Common

### Schema

It's using the `schema` which must have following fields:

```js
{
  password: /* sha1 password hashed */,
  apikey: /* direct key for auth from api, unique */,
  perms: [
    /* perm list */
  ]
}
```

## Actions

### `register`

Arguments: 

- `data` (type: `object`) form data to register.

Return:

- (type: `object`) row object of user registerd.

### `login`

Arguments:

- `data` (type: `object`) form data to login, it should have `password` or `apikey`.

Return:

- (type: `string`) JWT token.

### `gate`

- Parse/check token and get user.
- Validate user's perms.  

Arguments:

- `token`
- `apikey`
- `auth` Auth object for authorization.
- `perms` Default perms when user not existed.

Return:

- (type: `object`) user info or `null`.

## License

MIT