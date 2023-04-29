import { defineAction } from '@rugo-vn/service';
import { Secure } from '@rugo-vn/shared';

defineAction('register', async function ({ data }) {
  const { email, password } = data;

  const user = await this.call('db.create', {
    data: { email, creds: [{ key: Secure.hashPassword(password) }] },
  });

  delete user.creds;

  return { user };
});

defineAction('login', async function ({ data }) {
  const { email, password } = data;

  const user = (await this.call('db.find', { cond: { email } })).data[0];

  return { user };
});
