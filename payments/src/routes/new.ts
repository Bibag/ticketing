import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import {
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  OrderStatus,
  requireAuth,
  validateRequest,
} from '@mrltickets/common';
import { stripe } from '../stripe';
import { Order } from '../models/order';
import { Payment } from '../models/payment';
import { PaymentCreatedPublisher } from '../events/publisher/payment-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post(
  '/api/payments',
  requireAuth,
  [
    body('token').trim().not().isEmpty().withMessage('Token is required'),
    body('orderId')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Order ID is required')
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage('Order ID must be valid'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { token, orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new BadRequestError('Order ID must be valid');
    }

    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError();
    }
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }
    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError('Cannot pay for an cancelled order');
    }
    if (order.status === OrderStatus.Complete) {
      throw new BadRequestError('Cannot pay for an already paid order');
    }

    const charge = await stripe.charges.create({
      currency: 'usd',
      amount: order.price * 100,
      source: token,
    });

    const payment = Payment.build({
      orderId,
      stripeId: charge.id,
    });
    await payment.save();

    const messageData = {
      id: payment.id,
      orderId: payment.orderId,
      stripeId: payment.stripeId,
    };

    await new PaymentCreatedPublisher(natsWrapper.client).publish(messageData);

    res.status(201).send({ id: payment.id });
  }
);

export { router as createChargeRouter };
