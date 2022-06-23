import request from 'supertest';
import { app } from '../../app';

it('fails when a email that does not exist is supplied', async () => {
  await request(app)
    .post('/api/users/signin')
    .send({
      email: 'test@e.com',
      password: 'password',
    })
    .expect(400);
});

it('fails when an incorrect password is supplied', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'aaaaaaa@g.com',
      password: 'ddddddddddd',
    })
    .expect(201);

  await request(app)
    .post('/api/users/signin')
    .send({
      email: 'aaaaaaa@g.com',
      password: 'dd',
    })
    .expect(400);
});

it('return a 201 on successful signin', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'aaaaaaa@g.com',
      password: 'ddddddddddd',
    })
    .expect(201);

  await request(app)
    .post('/api/users/signin')
    .send({
      email: 'aaaaaaa@g.com',
      password: 'ddddddddddd',
    })
    .expect(201);
});

it('responds with a cookie when given valid credentials', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'aaaaaaa@g.com',
      password: 'ddddddddddd',
    })
    .expect(201);

  const response = await request(app)
    .post('/api/users/signin')
    .send({
      email: 'aaaaaaa@g.com',
      password: 'ddddddddddd',
    })
    .expect(201);

  expect(response.get('Set-Cookie')).toBeDefined();
});
