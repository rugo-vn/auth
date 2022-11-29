import { RugoException } from '@rugo-vn/exception';

export const before = {
  all (args) {
    args.schema = this.globals[`schema.${this.model}`];
    if (!args.schema) { throw new RugoException('Could not find model for auth'); }
  }
};
