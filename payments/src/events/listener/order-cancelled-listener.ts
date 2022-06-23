import {
  Listener,
  OrderCancelledEvent,
  OrderStatus,
  Subjects,
  BadRequestError,
} from '@mrltickets/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';
import { queueGroupName } from './queue-group-name';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
  readonly queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    try {
      if (!mongoose.Types.ObjectId.isValid(data.id)) {
        throw new BadRequestError('Order ID must be valid');
      }

      const order = await Order.findOne({
        _id: data.id,
        version: data.version - 1,
      });

      if (!order) {
        throw new Error('[In order-cancelled-listener] Order not found');
      }

      if (
        order.status === OrderStatus.Cancelled ||
        order.status === OrderStatus.Complete
      ) {
        return msg.ack();
      }

      order.set({ status: OrderStatus.Cancelled });
      await order.save();

      msg.ack();
    } catch (error) {
      console.error('[In order-cancelled-listener] Something went wrong');
    }
  }
}
