import {
  BadRequestError,
  Listener,
  OrderCreatedEvent,
  Subjects,
} from '@mrltickets/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';
import { queueGroupName } from './queue-group-name';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  readonly queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    try {
      if (!mongoose.Types.ObjectId.isValid(data.id)) {
        throw new BadRequestError('Order ID must be valid');
      }

      const order = Order.build({
        id: data.id,
        status: data.status,
        version: data.version,
        userId: data.userId,
        price: data.ticket.price,
      });

      await order.save();

      msg.ack();
    } catch (error) {
      console.error('[In order-created-listener] Something went wrong');
    }
  }
}
