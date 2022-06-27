import {
  BadRequestError,
  Listener,
  OrderStatus,
  OrderUpdatedEvent,
  Subjects,
} from '@mrltickets/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { TicketUpdatetedPublisher } from '../publisher/ticket-updated-publisher';
import { natsWrapper } from '../../nats-wrapper';
import { queueGroupName } from './queue-group-name';

export class OrderUpdatedListener extends Listener<OrderUpdatedEvent> {
  readonly subject = Subjects.OrderUpdated;
  readonly queueGroupName = queueGroupName;

  async onMessage(data: OrderUpdatedEvent['data'], msg: Message) {
    try {
      if (!mongoose.Types.ObjectId.isValid(data.ticket.id)) {
        throw new BadRequestError('Ticket ID must be valid');
      }

      const ticket = await Ticket.findById(data.ticket.id);

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (data.status === OrderStatus.Complete) {
        ticket.reservedQuantity = ticket.reservedQuantity - data.quantity;
        ticket.soldQuantity = ticket.soldQuantity + data.quantity;
        await ticket.save();

        const messageData = {
          id: ticket.id,
          title: ticket.title,
          price: ticket.price,
          quantity: ticket.quantity,
          availableQuantity: ticket.availableQuantity(),
          userId: ticket.userId,
          version: ticket.version,
          status: ticket.status,
        };
        await new TicketUpdatetedPublisher(natsWrapper.client).publish(
          messageData
        );
      }

      msg.ack();
    } catch (error) {
      console.error('[In order-updated-listener] Something went wrong', error);
    }
  }
}
