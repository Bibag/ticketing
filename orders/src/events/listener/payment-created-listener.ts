import {
  BadRequestError,
  Listener,
  OrderStatus,
  PaymentCreatedEvent,
  Subjects,
} from '@mrltickets/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';
import { OrderUpdatedPublisher } from '../publisher/order-updated-publisher';
import { queueGroupName } from './queue-group-name';

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
  readonly queueGroupName = queueGroupName;

  async onMessage(data: PaymentCreatedEvent['data'], msg: Message) {
    try {
      if (!mongoose.Types.ObjectId.isValid(data.orderId)) {
        throw new BadRequestError('Order ID  Must be valid');
      }

      const order = await Order.findById(data.orderId);

      if (!order) {
        throw Error('Order not found');
      }

      if (
        order.status === OrderStatus.Cancelled ||
        order.status === OrderStatus.Complete
      ) {
        return msg.ack();
      }

      order.set({ status: OrderStatus.Complete });
      await order.save();

      const messageData = {
        id: order.id,
        version: order.version,
        status: order.status,
      };

      await new OrderUpdatedPublisher(this.client).publish(messageData);

      msg.ack();
    } catch (error) {
      console.error('[In paymment-created-listener] Something went wrong!');
    }
  }
}
