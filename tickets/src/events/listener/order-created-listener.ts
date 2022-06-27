import {
  BadRequestError,
  Listener,
  OrderCreatedEvent,
  Subjects,
} from '@mrltickets/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { queueGroupName } from './queue-group-name';
import { TicketUpdatetedPublisher } from '../publisher/ticket-updated-publisher';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  readonly queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    try {
      if (!mongoose.Types.ObjectId.isValid(data.ticket.id)) {
        throw new BadRequestError('Order ID must be valid');
      }
      //find the ticket that the order is reserved
      const ticket = await Ticket.findById(data.ticket.id);

      //if  no ticket, throw error
      if (!ticket) {
        throw new Error('[In order-created-listener]: Ticket not found');
      }

      //mark  the ticket as being reserved by  setting its orderId property, reservedQuantity
      ticket.reservedQuantity = ticket.reservedQuantity + data.quantity;
      ticket.orderId!.push(data.id);

      //save the ticket
      await ticket.save();

      //publish an event
      const messageData = {
        id: ticket.id,
        version: ticket.version,
        title: ticket.title,
        price: ticket.price,
        quantity: ticket.quantity,
        availableQuantity: ticket.availableQuantity(),
        userId: ticket.userId,
        orderId: ticket.orderId,
        status: ticket.status,
      };
      await new TicketUpdatetedPublisher(this.client).publish(messageData);

      //ack message
      msg.ack();
    } catch (error) {
      console.error('Something went wrong!');
    }
  }
}
