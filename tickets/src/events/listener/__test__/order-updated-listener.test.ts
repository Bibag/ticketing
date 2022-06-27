import {
  Listener,
  OrderStatus,
  OrderUpdatedEvent,
  TicketStatus,
} from '@mrltickets/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../../models/ticket';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderUpdatedListener } from '../order-updated-listener';

const setup = async () => {
  const listener = new OrderUpdatedListener(natsWrapper.client);

  const id = new mongoose.Types.ObjectId().toHexString();
  const ticket = Ticket.build({
    title: 'concert',
    price: 10,
    quantity: 100,
    reservedQuantity: 20,
    soldQuantity: 10,
    status: TicketStatus.Available,
    userId: new mongoose.Types.ObjectId().toHexString(),
  });
  ticket.set({ orderId: [id] });
  await ticket.save();

  const data: OrderUpdatedEvent['data'] = {
    id: id,
    version: 0,
    status: OrderStatus.Complete,
    ticket: {
      id: ticket.id,
    },
    quantity: 2,
  };

  //@ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, ticket, data, msg };
};

it('updates reservedQunatity, soldQuantity of the ticket', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(data.ticket.id);

  expect(updatedTicket!.reservedQuantity).toEqual(
    ticket.reservedQuantity - data.quantity
  );
  expect(updatedTicket!.soldQuantity).toEqual(
    ticket.soldQuantity + data.quantity
  );
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it('publishes the message', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish as jest.Mock).toHaveBeenCalled();

  //@ts-ignore
  const ticketUpdatedData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );

  expect(ticketUpdatedData.id).toEqual(ticket.id);
});
