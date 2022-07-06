# Rugo Auth

Authentication and Authorization.

## Usage

```js
const login = createLogin(composer);
const gate = createGate(composer);


const exec = login('secret', model, form);
const exec = gate('secret', model, disabled, token context);

await exec(context);
```

## API

[Visit API documentation.](./docs/API.md)

## License

MIT