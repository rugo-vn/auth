# Rugo Auth

Authentication and Authorization.

## Overview

## Settings

```js
const settings = {
  auth: {
    secret: /* secret string, using for encrypt */,
    model: /* model name to use validation */,
  }
}
```

## Common

### Globals

- `schema.<modelName>`

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

You can got this from `_ref: 'user'`.

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