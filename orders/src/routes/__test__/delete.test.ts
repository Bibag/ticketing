import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { Order, OrderStatus } from '../../models/order';
import { natsWrapper } from '../../nats-wrapper';
import { TicketStatus } from '@mrltickets/common';

it('can only be accessed if the user is signed in', async () => {
  const orderId = new mongoose.Types.ObjectId().toHexString();
  await request(app).delete(`/api/orders/${orderId}`).send({}).expect(401);
});

it('return a status other than 401 if the user is signed in', async () => {
  const orderId = new mongoose.Types.ObjectId().toHexString();
  const response = await request(app)
    .delete(`/api/orders/${orderId}`)
    .set('Cookie', global.signin())
    .send({});

  expect(response.status).not.toEqual(401);
});

it('return an error if the orderId is not valid', async () => {
  await request(app)
    .delete('/api/orders/dasdad3123123sa')
    .set('Cookie', global.signin())
    .send({})
    .expect(400);
});

it('return an error if the order is not found', async () => {
  const orderId = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .delete(`/api/orders/${orderId}`)
    .set('Cookie', global.signin())
    .send({})
    .expect(404);
});

it('return an error if the user is not the owner of the order', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  const ticket = Ticket.build({
    id,
    title: 'test',
    price: 20,
    quantity: 100,
    availableQuantity: 92,
    status: TicketStatus.Available,
  });
  await ticket.save();

  const orderResponse = await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId: ticket.id, quantity: 15 })
    .expect(201);

  await request(app)
    .delete(`/api/orders/${orderResponse.body.id}`)
    .set('Cookie', global.signin())
    .send({})
    .expect(401);
});

it('can change status to cancelled', async () => {
  const cookie = global.signin();
  const id = new mongoose.Types.ObjectId().toHexString();

  const ticket = Ticket.build({
    id,
    title: 'test',
    price: 20,
    quantity: 100,
    availableQuantity: 92,
    status: TicketStatus.Available,
  });
  await ticket.save();

  const orderResponse = await request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({ ticketId: ticket.id, quantity: 15 })
    .expect(201);

  await request(app)
    .delete(`/api/orders/${orderResponse.body.id}`)
    .set('Cookie', cookie)
    .send({})
    .expect(204);

  const updateOrder = await Order.findById(orderResponse.body.id);

  expect(updateOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('publishes an event', async () => {
  const cookie = global.signin();
  const id = new mongoose.Types.ObjectId().toHexString();

  const ticket = Ticket.build({
    id,
    title: 'test',
    price: 20,
    quantity: 100,
    availableQuantity: 92,
    status: TicketStatus.Available,
  });
  await ticket.save();

  const orderResponse = await request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({ ticketId: ticket.id, quantity: 15 })
    .expect(201);

  await request(app)
    .delete(`/api/orders/${orderResponse.body.id}`)
    .set('Cookie', cookie)
    .send({})
    .expect(204);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
