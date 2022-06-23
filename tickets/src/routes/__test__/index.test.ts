import request from 'supertest';
import { app } from '../../app';

const createTicket = (title: string, price: number) => {
  return request(app).post('/api/tickets').set('Cookie', global.signin()).send({
    title,
    price,
  });
};

it('can fetch a list of tickets', async () => {
  await createTicket('Ticket#1', 1);
  await createTicket('Ticket#2', 2);
  await createTicket('Ticket#3', 3);
  await createTicket('Ticket#4', 4);
  await createTicket('Ticket#5', 5);

  const response = await request(app)
    .get('/api/tickets')
    .set('Cookie', global.signin())
    .expect(200);

  expect(response.body.length).toEqual(5);
});
