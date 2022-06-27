import {
  BadRequestError,
  currentUser,
  NotFoundError,
  requireAuth,
  validateRequest,
} from '@mrltickets/common';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { User } from '../models/user';
import { Password } from '../services/password';

const router = express.Router();

router.put(
  '/api/users/update-password',
  currentUser,
  requireAuth,
  [
    body('email').trim().isEmail().withMessage('Email must be valid'),
    body('password')
      .trim()
      .isLength({ min: 8, max: 255 })
      .withMessage('Password must be between 8 and 255 characters'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await User.findById(req.currentUser!.id);

    if (!user) {
      throw new NotFoundError();
    }

    if (email !== user.email) {
      throw new BadRequestError('Email cannot be changed');
    }

    const passwordMatch = await Password.compare(user.password, password);

    if (passwordMatch) {
      throw new BadRequestError(
        'New password must not be the same as old password'
      );
    }

    user.set({ password });

    await user.save();

    res.status(200).send(user);
  }
);

export { router as updatePasswordRouter };
