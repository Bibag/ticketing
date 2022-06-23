import {
  Listener,
  ExpirationCompleteEvent,
  Subjects,
  BadRequestError,
  OrderStatus,
} from '@mrltickets/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';
import { OrderCancelledPublisher } from '../publisher/order-cancelled-publisher';
import { queueGroupName } from './queue-group-name';

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
  readonly queueGroupName = queueGroupName;

  async onMessage(data: ExpirationCompleteEvent['data'], msg: Message) {
    try {
      if (!mongoose.Types.ObjectId.isValid(data.orderId)) {
        throw new BadRequestError('Order ID must be valid');
      }

      const order = await Order.findById(data.orderId).populate('ticket');

      if (!order) {
        throw new Error('[In expiration-complete-listener] Order not found');
      }

      if (
        order.status === OrderStatus.Cancelled ||
        order.status === OrderStatus.Complete
      ) {
        return msg.ack();
      }

      order.set({ status: OrderStatus.Cancelled });

      await order.save();

      const messageData = {
        id: order.id,
        version: order.version,
        ticket: {
          id: order.ticket.id,
        },
      };

      await new OrderCancelledPublisher(this.client).publish(messageData);

      msg.ack();
    } catch (error) {
      console.error(
        '[In expiration-complete-listener] Something went wrong: ',
        error
      );
    }
  }
}
