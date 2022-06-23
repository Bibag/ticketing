import { Publisher, Subjects, TicketCreatedEvent } from '@mrltickets/common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}
