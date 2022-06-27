import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import {
  NotFoundError,
  BadRequestError,
  requireAuth,
  NotAuthorizedError,
  OrderStatus,
} from '@mrltickets/common';
import { Order } from '../models/order';
import { OrderCancelledPublisher } from '../events/publisher/order-cancelled-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.delete(
  '/api/orders/:orderId',
  requireAuth,
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new BadRequestError('Order ID must be valid');
    }

    const order = await Order.findById(orderId).populate('ticket');

    if (!order) {
      throw new NotFoundError();
    }

    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError('Order already cancelled');
    }

    if (order.status === OrderStatus.Complete) {
      throw new BadRequestError('Cannot delete already paid order');
    }

    order.set({ status: OrderStatus.Cancelled });

    await order.save();

    const messageData = {
      id: order.id,
      version: order.version,
      ticket: {
        id: order.ticket.id,
      },
      quantity: order.quantity,
    };

    await new OrderCancelledPublisher(natsWrapper.client).publish(messageData);

    res.status(204).send();
  }
);

export { router as deleteOrderRouter };
