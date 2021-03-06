import mongoose from 'mongoose';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCreatedListener } from '../order-created-listener';
import { Ticket } from '../../../models/ticket';
import {
  OrderCreatedEvent,
  OrderStatus,
  TicketStatus,
} from '@mrltickets/common';
import { Message } from 'node-nats-streaming';

const setup = async () => {
  //create an  instance of the listener
  const listener = new OrderCreatedListener(natsWrapper.client);

  //create and  save a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 25,
    quantity: 34,
    reservedQuantity: 0,
    soldQuantity: 0,
    userId: new mongoose.Types.ObjectId().toHexString(),
    status: TicketStatus.Available,
  });
  await ticket.save();

  //create the  fake data event
  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId: new mongoose.Types.ObjectId().toHexString(),
    expiresAt: new Date().toISOString(),
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
    quantity: 10,
  };

  //create the fake message object
  //@ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  //return all of  the stuff
  return { listener, ticket, data, msg };
};

it('sets the orderId of the ticket', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket).toBeDefined();
  expect(updatedTicket!.price).toEqual(data.ticket.price);
  expect(updatedTicket!.orderId![0]).toEqual(data.id);
});

it('acks the message', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it('publishes a  ticket updated event', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  //@ts-ignore
  const ticketUpdatedData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );

  expect(ticketUpdatedData.orderId[0]).toEqual(data.id);
});
