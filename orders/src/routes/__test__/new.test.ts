import mongoose, { mongo } from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order';
import { Ticket } from '../../models/ticket';
import { OrderStatus, TicketStatus } from '@mrltickets/common';
import { natsWrapper } from '../../nats-wrapper';

it('can only be accessed if the user is signed in', async () => {
  const ticketId = new mongoose.Types.ObjectId();
  await request(app).post('/api/orders').send({ ticketId }).expect(401);
});

it('return a status other than 401 if the user is signed in', async () => {
  const ticketId = new mongoose.Types.ObjectId();
  const response = await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId, quantity: 1 });

  expect(response.status).not.toEqual(401);
});

it('return an error if the ticket does not exist', async () => {
  const ticketId = new mongoose.Types.ObjectId();
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId, quantity: 1 })
    .expect(404);
});

it('return an error if the quantity exceeds availableQuantity', async () => {
  const id = new mongoose.Types.ObjectId().toString();
  const ticket = Ticket.build({
    id,
    title: 'test',
    price: 20,
    quantity: 30,
    availableQuantity: 20,
    status: TicketStatus.Available,
  });
  await ticket.save();

  const order = Order.build({
    userId: 'userIdTest',
    status: OrderStatus.Created,
    expiresAt: new Date(),
    ticket,
    quantity: 10,
  });
  await order.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId: ticket.id, quantity: ticket.availableQuantity + 1 })
    .expect(400);
});

it('reserves a ticket', async () => {
  const id = new mongoose.Types.ObjectId().toString();
  const ticket = Ticket.build({
    id,
    title: 'test',
    price: 20,
    quantity: 10,
    availableQuantity: 8,
    status: TicketStatus.Available,
  });
  await ticket.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId: ticket.id, quantity: 2 })
    .expect(201);
});

it('publishes an event', async () => {
  const id = new mongoose.Types.ObjectId().toString();
  const ticket = Ticket.build({
    id,
    title: 'test',
    price: 20,
    quantity: 10,
    availableQuantity: 8,
    status: TicketStatus.Available,
  });
  await ticket.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId: ticket.id, quantity: 3 })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
