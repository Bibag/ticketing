import { Publisher, Subjects, OrderCancelledEvent } from '@mrltickets/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}
