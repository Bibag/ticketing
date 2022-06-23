import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  BadRequestError,
  requireAuth,
  validateRequest,
} from '@mrltickets/common';

import { Ticket } from '../models/ticket';
import { TicketCreatedPublisher } from '../events/publisher/ticket-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post(
  '/api/tickets',
  requireAuth,
  [
    body('title')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Title is required')
      .isLength({ min: 4, max: 255 })
      .withMessage('Title must be between 4 and 255 characters'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater than 0'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { title, price } = req.body;

    // const existingTicket = await Ticket.findOne({
    //   title,
    //   userId: req.currentUser!.id,
    // });

    // if (existingTicket) {
    //   throw new BadRequestError('Ticket already exist');
    // }

    const ticket = Ticket.build({ title, price, userId: req.currentUser!.id });
    await ticket.save();

    const messageData = {
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
    };
    await new TicketCreatedPublisher(natsWrapper.client).publish(messageData);

    res.status(201).send(ticket);
  }
);

export { router as createTicketRouter };
