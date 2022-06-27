import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { TicketStatus } from '@mrltickets/common';

const createOrder = async (cookie: string[]) => {
  const id = new mongoose.Types.ObjectId().toString();
  const ticket = Ticket.build({
    id,
    title: 'test',
    price: 20,
    quantity: 100,
    availableQuantity: 92,
    status: TicketStatus.Available,
  });
  await ticket.save();

  return request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({ ticketId: ticket.id, quantity: 10 });
};

it('can only be accessed if the user is signed in', async () => {
  await request(app).get('/api/orders').send({}).expect(401);
});

it('return a status other than 401 if the user is signed in', async () => {
  const response = await request(app)
    .get('/api/orders')
    .set('Cookie', global.signin())
    .send({});

  expect(response.status).not.toEqual(401);
});

it('get all orders', async () => {
  const cookie = global.signin();
  await createOrder(cookie);
  await createOrder(cookie);
  await createOrder(cookie);
  await createOrder(cookie);
  await createOrder(cookie);

  const response = await request(app)
    .get('/api/orders')
    .set('Cookie', cookie)
    .send({});

  expect(response.body.length).toEqual(5);
});

const buildTicket = async () => {
  const id = new mongoose.Types.ObjectId().toString();
  const ticket = Ticket.build({
    id,
    title: 'concert',
    price: 20,
    quantity: 100,
    availableQuantity: 92,
    status: TicketStatus.Available,
  });
  await ticket.save();

  return ticket;
};

it('fetches orders for an particular user', async () => {
  // Create three tickets
  const ticketOne = await buildTicket();
  const ticketTwo = await buildTicket();
  const ticketThree = await buildTicket();

  const userOne = global.signin();
  const userTwo = global.signin();
  // Create one order as User #1
  await request(app)
    .post('/api/orders')
    .set('Cookie', userOne)
    .send({ ticketId: ticketOne.id, quantity: 15 })
    .expect(201);

  // Create two orders as User #2
  const { body: orderOne } = await request(app)
    .post('/api/orders')
    .set('Cookie', userTwo)
    .send({ ticketId: ticketTwo.id, quantity: 25 })
    .expect(201);
  const { body: orderTwo } = await request(app)
    .post('/api/orders')
    .set('Cookie', userTwo)
    .send({ ticketId: ticketThree.id, quantity: 35 })
    .expect(201);

  // Make request to get orders for User #2
  const response = await request(app)
    .get('/api/orders')
    .set('Cookie', userTwo)
    .expect(200);

  // Make sure we only got the orders for User #2
  expect(response.body.length).toEqual(2);
  expect(response.body[0].id).toEqual(orderOne.id);
  expect(response.body[1].id).toEqual(orderTwo.id);
  expect(response.body[0].ticket.id).toEqual(ticketTwo.id);
  expect(response.body[1].ticket.id).toEqual(ticketThree.id);
});
