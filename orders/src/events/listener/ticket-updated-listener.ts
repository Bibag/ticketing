import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import {
  Subjects,
  Listener,
  TicketUpdatedEvent,
  BadRequestError,
} from '@mrltickets/common';
import { Ticket } from '../../models/ticket';
import { queueGroupName } from './queue-group-name';

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: TicketUpdatedEvent['data'], msg: Message) {
    try {
      if (!mongoose.Types.ObjectId.isValid(data.id)) {
        throw new BadRequestError('Ticket ID must be valid');
      }
      const ticket = await Ticket.findByEvent({
        id: data.id,
        version: data.version,
      });

      if (!ticket) {
        throw new Error('[In ticket-updated-listener]: Ticket not found');
      }

      ticket.set({
        title: data.title,
        price: data.price,
        orderId: data.orderId,
      });
      await ticket.save();

      msg.ack();
    } catch (error) {
      console.error('Something went wrong!');
    }
  }
}
