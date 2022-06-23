import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

it('can only be accessed if the user is signed in', async () => {
  const orderId = new mongoose.Types.ObjectId();
  await request(app).get(`/api/orders/${orderId}`).send({}).expect(401);
});

it('return a status other than 401 if the user is signed in', async () => {
  const orderId = new mongoose.Types.ObjectId();
  const response = await request(app)
    .get(`/api/orders/${orderId}`)
    .set('Cookie', global.signin())
    .send({});

  expect(response.status).not.toEqual(401);
});

it('return an error if the orderId is not valid', async () => {
  await request(app)
    .get('/api/orders/dasdad3123123sa')
    .set('Cookie', global.signin())
    .send({})
    .expect(400);
});

it('return an error if the order is not found', async () => {
  const orderId = new mongoose.Types.ObjectId();
  await request(app)
    .get(`/api/orders/${orderId}`)
    .set('Cookie', global.signin())
    .send({})
    .expect(404);
});

it('return an error if the user is not the owner of the order', async () => {
  const id = new mongoose.Types.ObjectId().toString();
  const ticket = Ticket.build({
    id,
    title: 'test',
    price: 20,
  });
  await ticket.save();

  const orderResponse = await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId: ticket.id })
    .expect(201);

  await request(app)
    .get(`/api/orders/${orderResponse.body.id}`)
    .set('Cookie', global.signin())
    .send({})
    .expect(401);
});

it('return the order if the order is found', async () => {
  const cookie = global.signin();
  const id = new mongoose.Types.ObjectId().toString();

  const ticket = Ticket.build({
    id,
    title: 'test',
    price: 20,
  });
  await ticket.save();

  const orderResponse = await request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({ ticketId: ticket.id })
    .expect(201);

  await request(app)
    .get(`/api/orders/${orderResponse.body.id}`)
    .set('Cookie', cookie)
    .send({})
    .expect(200);
});
