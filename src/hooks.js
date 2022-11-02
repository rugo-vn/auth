import { RugoException } from '@rugo-vn/service';

export const before = {
  all (args) {
    args.schema = this.globals[`schema.${args.model}`];
    if (!args.schema) { throw new RugoException('Could not find model for auth'); }
  }
};
