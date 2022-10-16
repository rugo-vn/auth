import { RugoException } from '@rugo-vn/service';

export class ForbiddenError extends RugoException {
  constructor (msg) {
    super(msg);

    this.status = 403;
  }
}
