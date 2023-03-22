export const BASE_USER_SCHEMA = {
  properties: {
    credentials: {
      items: {
        properties: {
          key: { type: 'Id' },
          perms: { items: { type: 'Object' }, default: [] },
        },
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
