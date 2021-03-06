import { OrderCancelledEvent, TicketStatus } from '@mrltickets/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../../models/ticket';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCancelledListener } from '../order-cancelled-listener';
import { OrderUpdatedListener } from '../order-updated-listener';

const setup = async () => {
  //create an instance of the listener
  const listener = new OrderCancelledListener(natsWrapper.client);

  //create and save a ticket then set orderId
  const orderId = new mongoose.Types.ObjectId().toHexString();
  const ticket = Ticket.build({
    title: 'concert',
    price: 25,
    quantity: 34,
    reservedQuantity: 12,
    soldQuantity: 0,
    userId: new mongoose.Types.ObjectId().toHexString(),
    status: TicketStatus.Available,
  });

  ticket.set({ orderId: [orderId] });
  await ticket.save();

  //create the fake data event
  const data: OrderCancelledEvent['data'] = {
    id: orderId,
    version: 0,
    ticket: {
      id: ticket.id,
    },
    quantity: 9,
  };

  //create the fake message object
  //@ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  //return all the stuffs
  return { listener, ticket, data, msg };
};

it('remove orderId and change reservedQuantity', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(data.ticket.id);

  expect(updatedTicket!.orderId![0]).toBeUndefined();
  expect(updatedTicket!.reservedQuantity).toEqual(
    ticket.reservedQuantity - data.quantity
  );
});

it('acks the message', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it('publishes a ticket-updated event', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  //@ts-ignore
  const ticketUpdatedData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );

  expect(ticketUpdatedData.orderId![0]).toBeUndefined();
});
