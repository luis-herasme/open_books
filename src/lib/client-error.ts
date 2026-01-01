import * as HttpStatusCodes from 'stoker/http-status-codes';
import { ContentfulStatusCode } from 'hono/utils/http-status';

type ClientErrorOptions = {
  message: string;
  status?: ContentfulStatusCode;
};

export class ClientError extends Error {
  public readonly status: ContentfulStatusCode;

  constructor({ message, status = HttpStatusCodes.BAD_REQUEST }: ClientErrorOptions) {
    super(message);
    this.status = status;
  }
}
