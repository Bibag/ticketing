import { Publisher, Subjects, OrderUpdatedEvent } from '@mrltickets/common';

export class OrderUpdatedPublisher extends Publisher<OrderUpdatedEvent> {
  readonly subject = Subjects.OrderUpdated;
}
