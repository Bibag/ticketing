import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import {
  requireAuth,
  BadRequestError,
  NotFoundError,
  validateRequest,
  OrderStatus,
} from '@mrltickets/common';
import { body } from 'express-validator';
import { Ticket } from '../models/ticket';
import { Order } from '../models/order';
import { natsWrapper } from '../nats-wrapper';
import { OrderCreatedPublisher } from '../events/publisher/order-created-publisher';

const router = express.Router();

const EXPIRATION_WINDOW_SECONDS = 15 * 60;

router.post(
  '/api/orders',
  requireAuth,
  [
    body('ticketId')
      .not()
      .isEmpty()
      .withMessage('TicketId must be provided')
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage('TicketId mus be valid'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { ticketId } = req.body;
    const currentUser = req.currentUser!;

    //find the ticket the user is trying to order in the database
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError();
    }

    //make sure that this ticket is not already reserved
    //run query to look at all orders. Find an order where the ticket
    //is the ticket we just found *and* the orders status is *not* cancelled.
    //If we find and order from that means the ticket *is* reserved
    const isReserved = await ticket.isReserved();
    if (isReserved) {
      throw new BadRequestError('Ticket is already reserved');
    }

    //calculate an expiration date for this order
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    //build the order and save it to the database
    const order = Order.build({
      userId: currentUser.id,
      expiresAt: expiration,
      status: OrderStatus.Created,
      ticket,
    });
    await order.save();

    //publish an event saying that an order was created
    const messageData = {
      id: order.id,
      version: order.version,
      status: order.status,
      userId: order.userId,
      expiresAt: order.expiresAt.toISOString(),
      ticket: {
        id: order.ticket.id,
        price: order.ticket.price,
      },
    };
    await new OrderCreatedPublisher(natsWrapper.client).publish(messageData);

    res.status(201).send(order);
  }
);

export { router as createOrderRouter };
