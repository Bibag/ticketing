import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import {
  Subjects,
  Listener,
  TicketCreatedEvent,
  BadRequestError,
} from '@mrltickets/common';
import { Ticket } from '../../models/ticket';

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
  queueGroupName = 'order-service';

  async onMessage(data: TicketCreatedEvent['data'], msg: Message) {
    try {
      const { id, title, price } = data;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError('Ticket ID must be valid');
      }

      const ticket = Ticket.build({
        id,
        title,
        price,
      });

      await ticket.save();

      msg.ack();
    } catch (error) {
      console.error('Something went wrong!');
    }
  }
}
