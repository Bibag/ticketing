import { Publisher, Subjects, TicketUpdatedEvent } from '@mrltickets/common';

export class TicketUpdatetedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
}
