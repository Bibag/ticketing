import mongoose, { mongo } from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order';
import { Ticket } from '../../models/ticket';
import { OrderStatus } from '@mrltickets/common';
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
    .send({ ticketId });

  expect(response.status).not.toEqual(401);
});

it('return an error if the ticket does not exist', async () => {
  const ticketId = new mongoose.Types.ObjectId();
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId })
    .expect(404);
});

it('return an error if the ticket is already reserved', async () => {
  const id = new mongoose.Types.ObjectId().toString();
  const ticket = Ticket.build({
    id,
    title: 'test',
    price: 20,
  });
  await ticket.save();

  const order = Order.build({
    userId: 'userIdTest',
    status: OrderStatus.Created,
    expiresAt: new Date(),
    ticket,
  });
  await order.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId: ticket.id })
    .expect(400);
});

it('reserves a ticket', async () => {
  const id = new mongoose.Types.ObjectId().toString();
  const ticket = Ticket.build({
    id,
    title: 'test',
    price: 20,
  });
  await ticket.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId: ticket.id })
    .expect(201);
});

it('publishes an event', async () => {
  const id = new mongoose.Types.ObjectId().toString();
  const ticket = Ticket.build({
    id,
    title: 'test',
    price: 20,
  });
  await ticket.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId: ticket.id })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
