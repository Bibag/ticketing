import { TicketStatus } from '@mrltickets/common';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

it('return a 401 if the user is not login', async () => {
  const ticketId = new mongoose.Types.ObjectId().toHexString();

  await request(app).delete(`/api/tickets/${ticketId}`).send({}).expect(401);
});

it('return another status rather than 401 if the user is login', async () => {
  const ticketId = new mongoose.Types.ObjectId().toHexString();

  const response = await request(app)
    .delete(`/api/tickets/${ticketId}`)
    .set('Cookie', global.signin())
    .send({});

  expect(response.status).not.toEqual(401);
});

it('returna 404 if ticket not found', async () => {
  const ticketId = new mongoose.Types.ObjectId().toHexString();

  await request(app)
    .delete(`/api/tickets/${ticketId}`)
    .set('Cookie', global.signin())
    .send({})
    .expect(404);
});

it('return 401 if the user is not owner of the ticket', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  const ticket = Ticket.build({
    title: 'concert',
    price: 12,
    quantity: 100,
    reservedQuantity: 2,
    soldQuantity: 3,
    status: TicketStatus.Available,
    userId: id,
  });

  await ticket.save();

  await request(app)
    .delete(`/api/tickets/${ticket.id}`)
    .set('Cookie', global.signin())
    .send({})
    .expect(401);
});

it('return 400 if the ticket is reserved', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  const ticket = Ticket.build({
    title: 'concert',
    price: 12,
    quantity: 100,
    reservedQuantity: 2,
    soldQuantity: 3,
    status: TicketStatus.Available,
    userId: id,
  });
  ticket.set({ orderId: [new mongoose.Types.ObjectId().toHexString()] });
  await ticket.save();

  await request(app)
    .delete(`/api/tickets/${ticket.id}`)
    .set('Cookie', global.signin(id))
    .send({})
    .expect(400);
});

it('cancels the ticket', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  const ticket = Ticket.build({
    title: 'concert',
    price: 12,
    quantity: 100,
    reservedQuantity: 2,
    soldQuantity: 3,
    status: TicketStatus.Available,
    userId: id,
  });
  await ticket.save();

  await request(app)
    .delete(`/api/tickets/${ticket.id}`)
    .set('Cookie', global.signin(id))
    .send({})
    .expect(204);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket!.status).toEqual(TicketStatus.NotAvailable);
});
