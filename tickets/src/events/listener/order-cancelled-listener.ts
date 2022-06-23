import {
  BadRequestError,
  Listener,
  OrderCancelledEvent,
  Subjects,
} from '@mrltickets/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { TicketUpdatetedPublisher } from '../publisher/ticket-updated-publisher';
import { queueGroupName } from './queue-group-name';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
  readonly queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    try {
      if (!mongoose.Types.ObjectId.isValid(data.ticket.id)) {
        throw new BadRequestError('Ticket ID must be valid');
      }
      const ticket = await Ticket.findById(data.ticket.id);

      if (!ticket) {
        throw new Error('[In order-cancelled-listener]: Ticket not found');
      }

      ticket.set({ orderId: undefined });

      await ticket.save();

      const messageData = {
        id: ticket.id,
        version: ticket.version,
        title: ticket.title,
        price: ticket.price,
        userId: ticket.userId,
        orderId: ticket.orderId,
      };

      await new TicketUpdatetedPublisher(this.client).publish(messageData);

      msg.ack();
    } catch (error) {
      console.error(error);
    }
  }
}
