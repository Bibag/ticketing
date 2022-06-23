import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { natsWrapper } from '../../nats-wrapper';
import { Ticket } from '../../models/ticket';

it('return a 400 if the provided ticket id is not valid', async () => {
  const id = 'dsdasdsadsa';
  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'test',
      price: 20,
    })
    .expect(400);
});

it('return a 404 if the provided ticket id is not exist', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'test',
      price: 20,
    })
    .expect(404);
});

it('return a 401 if the user is not authenticated', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: 'test',
      price: 20,
    })
    .expect(401);
});

it('return a 401 if the user is not own the ticket', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'test',
      price: 20,
    })
    .expect(201);

  const ticketId = response.body.id;

  await request(app)
    .put(`/api/tickets/${ticketId}`)
    .set('Cookie', global.signin())
    .send({
      title: 'testupdate',
      price: 21,
    })
    .expect(401);
});

it('return a 400 if the user provided an invalid title or price', async () => {
  const cookie = global.signin();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'test',
      price: 20,
    })
    .expect(201);

  const ticketId = response.body.id;

  await request(app)
    .put(`/api/tickets/${ticketId}`)
    .set('Cookie', cookie)
    .send({
      title: '',
      price: 20,
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${ticketId}`)
    .set('Cookie', cookie)
    .send({
      title: 'test',
      price: -10,
    })
    .expect(400);
});

it('updates the ticket provided valid input', async () => {
  const cookie = global.signin();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'test',
      price: 20,
    })
    .expect(201);

  const ticketId = response.body.id;

  const titleUpdate = 'testupdate';
  const priceUpdate = 21;

  const responseTicket = await request(app)
    .put(`/api/tickets/${ticketId}`)
    .set('Cookie', cookie)
    .send({
      title: titleUpdate,
      price: priceUpdate,
    })
    .expect(200);

  expect(responseTicket.body.title).toEqual(titleUpdate);
  expect(responseTicket.body.price).toEqual(priceUpdate);
});

it('publishes an event', async () => {
  const cookie = global.signin();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'test',
      price: 20,
    })
    .expect(201);

  const ticketId = response.body.id;

  const titleUpdate = 'testupdate';
  const priceUpdate = 21;

  const responseTicket = await request(app)
    .put(`/api/tickets/${ticketId}`)
    .set('Cookie', cookie)
    .send({
      title: titleUpdate,
      price: priceUpdate,
    })
    .expect(200);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it('rejects updates if the ticket is reserved', async () => {
  const cookie = global.signin();
  const orderId = new mongoose.Types.ObjectId().toHexString();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'test',
      price: 20,
    })
    .expect(201);

  const ticket = await Ticket.findById(response.body.id);
  ticket!.set({ orderId });
  await ticket!.save();

  await request(app)
    .put(`/api/tickets/${ticket!.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'udpate',
      price: 999,
    })
    .expect(400);
});
