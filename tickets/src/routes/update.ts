import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  NotFoundError,
  BadRequestError,
  NotAuthorizedError,
  requireAuth,
  validateRequest,
} from '@mrltickets/common';
import { Ticket } from '../models/ticket';
import { TicketUpdatetedPublisher } from '../events/publisher/ticket-updated-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.put(
  '/api/tickets/:id',
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
    const currentUserId = req.currentUser!.id;
    const { id } = req.params;
    const { title, price } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Ticket ID must be valid');
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      throw new NotFoundError();
    }

    if (ticket.userId !== currentUserId) {
      throw new NotAuthorizedError();
    }

    if (ticket.orderId) {
      throw new BadRequestError('Cannot edit a reserved ticket');
    }

    const oldVersion = ticket.version;

    ticket.set({
      title,
      price,
    });
    await ticket.save();

    const newVersion = ticket.version;

    if (newVersion > oldVersion) {
      const messageData = {
        id: ticket.id,
        title: ticket.title,
        price: ticket.price,
        userId: ticket.userId,
        version: ticket.version,
      };
      await new TicketUpdatetedPublisher(natsWrapper.client).publish(
        messageData
      );
    }

    res.send(ticket);
  }
);

export { router as updateTicketRouter };
