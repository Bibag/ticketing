import {
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  requireAuth,
  TicketStatus,
} from '@mrltickets/common';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Ticket } from '../models/ticket';

const router = express.Router();

router.delete(
  '/api/tickets/:ticketId',
  requireAuth,
  async (req: Request, res: Response) => {
    const { ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      throw new BadRequestError('Ticket ID must be valid');
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      throw new NotFoundError();
    }

    if (ticket.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    if (ticket.status === TicketStatus.NotAvailable) {
      throw new BadRequestError('Ticket already been cancelled');
    }

    if (ticket.orderId?.length) {
      throw new BadRequestError('Cannot cancel a reserved ticket');
    }

    ticket.set({ status: TicketStatus.NotAvailable });
    await ticket.save();

    res.status(204).send();
  }
);

export { router as deleteTicketRouter };
