import request from 'supertest';
import { app } from '../../app';

it('get currentUser null, jwt null when successful signout', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(201);

  const responseSignout = await request(app)
    .post('/api/users/signout')
    .expect(200);
  expect(responseSignout.get('Set-Cookie')[0]).toEqual(
    'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly'
  );
});
