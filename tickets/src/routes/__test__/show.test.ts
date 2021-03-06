import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';

it('return a 400 if the ticket id is not valid', async () => {
  const id = 'dsadsadd';

  await request(app).get(`/api/tickets/${id}`).send().expect(400);
});

it('return a 404 if the ticket is not found', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  await request(app).get(`/api/tickets/${id}`).send().expect(404);
});

it('return the ticket if the ticket is found', async () => {
  const title = 'concert';
  const price = 20;
  const quantity = 30;

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title,
      price,
      quantity,
    })
    .expect(201);

  const ticketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
    .expect(200);

  expect(ticketResponse.body.title).toEqual(title);
  expect(ticketResponse.body.price).toEqual(price);
  expect(ticketResponse.body.quantity).toEqual(quantity);
});
