import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { clone, path } from 'ramda';

export const name = 'auth';

export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return false;
  }
};

export const actions = {
  async login (ctx) {
    const { form, identities } = ctx.params;

    // make filters
    const filters = identities.map(field => {
      const filter = {};
      filter[field] = form.identity;
      return filter;
    });

    // try get user
    let user;
    for (const filter of filters) {
      const res = await ctx.call('model.find', { filters: filter, limit: 1 });
      if (!res.data[0]) { continue; }

      user = res.data[0];
      break;
    }

    if (!user) { return this.forbidden(); }

    // compare password
    if (!bcrypt.compareSync(form.password, user.password)) {
      return this.forbidden();
    }

    // sign
    const token = jwt.sign({
      id: user._id
    }, this.settings.secret, {
      expiresIn: '30d'
    });

    return {
      status: 200,
      body: {
        status: 'success',
        data: token
      }
    };
  },

  async parse(ctx) {
    const user = await this.parseAndGetUser(ctx);
    if (!user)
      return this.forbidden();

    return {
      status: 200,
      body: {
        status: 'success',
        data: user
      }
    }
  },

  validate(ctx){
    const { metaPerm, user } = ctx.params;

    return {
      status: 200,
      body: {
        status: 'success',
        data: this.validatePerm(metaPerm, user)
      }
    }
  },

  async gate (ctx) {
    const user = await this.parseAndGetUser(ctx);
    if (!user)
      return this.forbidden();

    // validate permissions
    const metaPerm = ctx.meta.perm || {};

    if (Object.keys(metaPerm).length === 0) { return null; }

    if (this.validatePerm(metaPerm, user))
      return null;

    return this.forbidden();
  }
};

export const hooks = {
  before: {
    async all({ meta, params }) {
      meta.schema = meta.authSchema;

      if (!meta.schema) { throw new Error('authSchema must be defined'); }

      const identityFields = ['_id', ...(meta.schema.identities || [])];

      params.identities = identityFields;
    }
  }
};

export const methods = {
  forbidden () {
    return {
      status: 403,
      body: {
        status: 'error',
        data: [{ type: 'general', message: 'forbidden' }]
      }
    };
  },

  async parseAndGetUser(ctx) {
    // get token
    const token = path(['params', 'headers', 'authorization'], ctx);

    if (!token) { return null }

    const [authType, authToken] = token.split(' ');
    let user;

    // validate token
    if (authType === 'Bearer') {
      const rel = await verifyToken(authToken, this.settings.secret);
      if (rel) {
        const res = await ctx.call('model.get', { id: rel.id });
        if (res.data) { return res.data; }
      }
    }

    return null;
  },

  validatePerm(metaPerm, user){
    for (const userPerm of user.perms || []) {
      let isMatch = true;

      for (const key in metaPerm) {
        if (userPerm[key] === '*') { continue; }

        if (userPerm[key] === metaPerm[key]) { continue; }

        isMatch = false;
        break;
      }

      if (isMatch) {
        return true;
      }
    }

    return false;
  }
};