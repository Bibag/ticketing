import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../app';
import jwt from 'jsonwebtoken';

jest.setTimeout(10000);

jest.mock('../nats-wrapper');

declare global {
  var signin: (id?: string) => string[];
}

process.env.STRIPE_KEY =
  'sk_test_51LCy21BrPgNinwic7pHDkSxebE1IDowMF9Qk2XEbTfZu0ynrtbshJVKTsN9G05pY2AuAuj9QbaXKj7kBEf9G95OM00FPmb0KCa';

let mongo: any;
beforeAll(async () => {
  process.env.JWT_KEY = 'dsadasdsad';

  mongo = await MongoMemoryServer.create();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

global.signin = (id) => {
  //build a JWT payload. {id, email}
  const payload = {
    id: id || new mongoose.Types.ObjectId().toHexString(),
    email: 'test@tes.com',
  };

  //create the JWT
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  //build session Object. {jwt :MY_JWT}
  const session = { jwt: token };

  //turn that session into JSON
  const sessionJSON = JSON.stringify(session);

  //take JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString('base64');

  //return a string thats the cookie with the encoded data
  return [`session=${base64}`];
};
