import { natsWrapper } from '../../../nats-wrapper';
import mongoose from 'mongoose';
import { Order } from '../../../models/order';
import { OrderUpdatedListener } from '../order-updated-listener';
import { OrderUpdatedEvent, OrderStatus } from '@mrltickets/common';

const setup = async () => {
  //create  an instance of the  listener
  const listener = new OrderUpdatedListener(natsWrapper.client);

  //create and  save an order
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId: new mongoose.Types.ObjectId().toHexString(),
    price: 17,
  });
  await order.save();

  //create a fake data object
  const data: OrderUpdatedEvent['data'] = {
    id: order.id,
    version: order.version + 1,
    status: OrderStatus.Complete,
    ticket: {
      id: new mongoose.Types.ObjectId().toHexString(),
    },
    quantity: 10,
  };

  //create a  fake  message object
  //@ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  //return  all the stuffs
  return { listener, order, data, msg };
};

it('updates the order status to complete', async () => {
  const { listener, order, data, msg } = await setup();

  await listener.onMessage(data, msg);

  const updatedOrder = await Order.findById(data.id);

  expect(updatedOrder).toBeDefined();
  expect(updatedOrder!.status).toEqual(OrderStatus.Complete);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack as jest.Mock).toHaveBeenCalled();
});
