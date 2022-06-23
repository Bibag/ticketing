import mongoose from 'mongoose';
import {
  Listener,
  Subjects,
  OrderUpdatedEvent,
  BadRequestError,
  OrderStatus,
} from '@mrltickets/common';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';
import { queueGroupName } from './queue-group-name';

export class OrderUpdatedListener extends Listener<OrderUpdatedEvent> {
  readonly subject = Subjects.OrderUpdated;
  readonly queueGroupName = queueGroupName;

  async onMessage(data: OrderUpdatedEvent['data'], msg: Message) {
    try {
      if (!mongoose.Types.ObjectId.isValid(data.id)) {
        throw new BadRequestError('Order ID must be valid');
      }

      const order = await Order.findOne({
        _id: data.id,
        version: data.version - 1,
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (
        order.status === OrderStatus.Cancelled ||
        order.status === OrderStatus.Complete
      ) {
        return msg.ack();
      }

      order.set({ status: data.status });
      await order.save();

      msg.ack();
    } catch (error) {
      console.error('[In order-updated-listener] Soething  went wrong!');
    }
  }
}
