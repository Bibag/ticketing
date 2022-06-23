import mongoose from 'mongoose';
import { Ticket } from '../ticket';

it('implements optimistic concurrency control', async () => {
  const id = new mongoose.Types.ObjectId().toString('hex');

  //create an instance of a ticket
  const ticket = Ticket.build({
    title: 'test',
    price: 5,
    userId: id,
  });

  //save the ticket to the database
  await ticket.save();

  //fetch the ticket twice
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id);

  //make two seperate changes to the tickets we fetched
  firstInstance!.set({ price: 10 });
  secondInstance!.set({ price: 15 });

  //save the first fetched ticket and expect an error
  await firstInstance!.save();

  try {
    await secondInstance!.save();
  } catch (err) {
    return;
  }

  throw new Error('Should not reach this point');
});

it('increments the version number on multiple saves', async () => {
  const id = new mongoose.Types.ObjectId().toString('hex');
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    userId: id,
  });

  await ticket.save();
  expect(ticket.version).toEqual(0);
  const ticket1 = await Ticket.findById(ticket.id);
  ticket1!.set({ price: 100 });
  await ticket1!.save();
  expect(ticket1!.version).toEqual(1);
  const ticket2 = await Ticket.findById(ticket.id);
  ticket2!.set({ price: 150 });
  await ticket2!.save();
  expect(ticket2!.version).toEqual(2);
});
