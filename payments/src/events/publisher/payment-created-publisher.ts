import { PaymentCreatedEvent, Publisher, Subjects } from '@mrltickets/common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
}
