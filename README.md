# Rugo Auth

Authentication and Authorization.

## Overview

## Settings

```js
const settings = {
  auth: {
    secret: /* secret string, using for encrypt */,
  }
}
```

## Common

### Globals

- `schema.<modelName>`

### Input Args

It take some variables:

- `model` Using for get users from model.

### Schema

It's using the `schema` of `model` which must have following fields:

```js
{
  password: /* sha1 password hashed */,
  apikey: /* direct key for auth from api, unique */,
  perms: [
    /* perm list */
  ]
}
```

These fields cannot create directly by `register` action.

## Actions

### `register`

If `schema` has `_acl` contains `create` action, it will allow register a new user.

Arguments:

- `{object} data` a form to create a user, it should have `password` or `apikey`.

Return:

- `{boolean}` return `true` if create successfully.

### `login`

Arguments:

- `{object} data` a query data, it should have `password` or `apikey`.

Return:

- `{string} token` JWT token.

### `gate`

Check `token` or `apikey` valid.

Arguments:

- `token`
- `apikey`
- `auth` Auth object for authorization.

Return:

- `{object} user` user info or `null`.

## License

MIT