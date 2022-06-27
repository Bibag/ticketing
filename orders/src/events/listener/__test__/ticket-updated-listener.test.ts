import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import request from 'supertest';
import { Ticket } from '../../../models/ticket';
import { TicketStatus, TicketUpdatedEvent } from '@mrltickets/common';
import { TicketUpdatedListener } from '../ticket-updated-listener';
import { natsWrapper } from '../../../nats-wrapper';

const setup = async () => {
  //create an  instance of  the listener
  const listener = new TicketUpdatedListener(natsWrapper.client);

  //create and  save  a  ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 15,
    quantity: 100,
    availableQuantity: 92,
    status: TicketStatus.Available,
  });
  await ticket.save();

  //create a fake data object
  const data: TicketUpdatedEvent['data'] = {
    id: ticket.id,
    version: ticket.version + 1,
    title: 'new concert',
    price: 999,
    quantity: 200,
    availableQuantity: 192,
    status: TicketStatus.Available,
    userId: new mongoose.Types.ObjectId().toHexString(),
  };

  //create a fake msg object
  //@ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  //return all of this stuff
  return { listener, ticket, data, msg };
};

it('finds, updates,  and saves a ticket', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket).toBeDefined();
  expect(updatedTicket!.title).toEqual(data.title);
  expect(updatedTicket!.price).toEqual(data.price);
  expect(updatedTicket!.quantity).toEqual(data.quantity);
  expect(updatedTicket!.availableQuantity).toEqual(data.availableQuantity);
});

it('akcs  the message', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it('does not call ack if the event has a skipped version number', async () => {
  const { listener, ticket, data, msg } = await setup();

  data.version = 10;

  await listener.onMessage(data, msg);
  expect(msg.ack).not.toHaveBeenCalled();
});
