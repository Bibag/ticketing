import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';

it('return a 401 if the user is not login', async () => {
  await request(app)
    .put('/api/users/update-password')
    .set('Cookie', '')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(401);
});

it('return other than 401 if the user is login', async () => {
  const user = await global.signin();

  const response = await request(app)
    .put('/api/users/update-password')
    .set('Cookie', user)
    .send({
      email: 'test@test.com',
      password: 'password',
    });

  expect(response.status).not.toEqual(401);
});

it('return a 400 if the email is modified', async () => {
  const user = await global.signin();

  await request(app)
    .put('/api/users/update-password')
    .set('Cookie', user)
    .send({
      email: 'update@test.com',
      password: 'updatedpassword',
    })
    .expect(400);
});

it('return a 400 if the password is invalid', async () => {
  const user = await global.signin();

  await request(app)
    .put('/api/users/update-password')
    .set('Cookie', user)
    .send({
      email: 'test@test.com',
      password: '111',
    })
    .expect(400);
});

it('return a 400 if password is not modified', async () => {
  const user = await global.signin();

  await request(app)
    .put('/api/users/update-password')
    .set('Cookie', user)
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(400);
});

it('successful change password', async () => {
  const user = await global.signin();

  await request(app)
    .put('/api/users/update-password')
    .set('Cookie', user)
    .send({
      email: 'test@test.com',
      password: 'updatedpassword',
    })
    .expect(200);
});
