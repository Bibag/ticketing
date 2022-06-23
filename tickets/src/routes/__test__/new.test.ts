import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper';

it('has a route handler listening to /api/tickets for post requests', async () => {
  const response = await request(app).post('/api/tickets').send({
    title: 'test',
    price: 12,
  });

  expect(response.status).not.toEqual(404);
});

it('can only be accessed if the user is signed in', async () => {
  await request(app)
    .post('/api/tickets')
    .send({
      title: 'test',
      price: 12,
    })
    .expect(401);
});

it('return a status other than 401 if the user is signed in', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'test',
      price: 12,
    });

  expect(response.status).not.toEqual(401);
});

it('return an error if an invalid title is provied', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: '',
      price: 12,
    })
    .expect(400);
});

it('return an error if an invalid price is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'test',
      price: -10,
    })
    .expect(400);
});

it('creates a ticket with valid inputs', async () => {
  let tickets = await Ticket.find({});
  expect(tickets.length).toEqual(0);

  const title = 'test';
  const price = 12;

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title,
      price,
    })
    .expect(201);

  tickets = await Ticket.find({});
  expect(tickets.length).toEqual(1);
  expect(tickets[0].title).toEqual(title);
  expect(tickets[0].price).toEqual(price);
});

// it('return a error if existed ticket title is provided', async () => {
//   const cookie = global.signin();
//   let tickets = await Ticket.find({});
//   expect(tickets.length).toEqual(0);

//   const title = 'test';
//   const price = 12;

//   await request(app)
//     .post('/api/tickets')
//     .set('Cookie', cookie)
//     .send({
//       title,
//       price,
//     })
//     .expect(201);

//   tickets = await Ticket.find({});
//   expect(tickets.length).toEqual(1);
//   expect(tickets[0].title).toEqual(title);
//   expect(tickets[0].price).toEqual(price);

//   await request(app)
//     .post('/api/tickets')
//     .set('Cookie', cookie)
//     .send({
//       title,
//       price,
//     })
//     .expect(400);
// });

it('publishes an event', async () => {
  const title = 'test';
  const price = 12;

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title,
      price,
    })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
