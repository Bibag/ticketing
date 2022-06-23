import {
  ExpirationCompleteEvent,
  Publisher,
  Subjects,
} from '@mrltickets/common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
}
