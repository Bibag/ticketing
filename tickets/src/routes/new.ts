import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  BadRequestError,
  requireAuth,
  TicketStatus,
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
      .trim()
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater than 0'),
    body('quantity')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Quantity is required')
      .isInt()
      .withMessage('Quantity must be valid')
      .isInt({ gt: 0 })
      .withMessage('Quantity must be a positive integer'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { title, price, quantity } = req.body;

    // const existingTicket = await Ticket.findOne({
    //   title,
    //   userId: req.currentUser!.id,
    // });

    // if (existingTicket) {
    //   throw new BadRequestError('Ticket already exist');
    // }

    const ticket = Ticket.build({
      title,
      price,
      quantity,
      reservedQuantity: 0,
      soldQuantity: 0,
      userId: req.currentUser!.id,
      status: TicketStatus.Available,
    });
    await ticket.save();

    const messageData = {
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      quantity: ticket.quantity,
      availableQuantity: ticket.availableQuantity(),
      userId: ticket.userId,
      version: ticket.version,
      status: ticket.status,
    };
    await new TicketCreatedPublisher(natsWrapper.client).publish(messageData);

    res.status(201).send(ticket);
  }
);

export { router as createTicketRouter };
