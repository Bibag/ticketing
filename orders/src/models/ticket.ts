import { TicketStatus } from '@mrltickets/common';
import mongoose from 'mongoose';
import { Order, OrderStatus } from './order';

interface TicketAttrs {
  id: string;
  title: string;
  price: number;
  quantity: number;
  availableQuantity: number;
  status: TicketStatus;
}

export interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  quantity: number;
  availableQuantity: number;
  version: number;
  orderId?: string[];
  status: TicketStatus;
  isReserved(): Promise<boolean>;
}

interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
  findByEvent(event: {
    id: string;
    version: number;
  }): Promise<TicketDoc | null>;
}

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      requried: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      min: 0,
    },
    orderId: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      required: true,
      enum: Object.values(TicketStatus),
      default: TicketStatus.Available,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    optimisticConcurrency: true,
    timestamps: true,
  }
);

ticketSchema.pre('save', async function (done) {
  if (this.isModified('quantity') || this.isModified('availableQuantity')) {
    this.set('quantity', parseInt(this.get('quantity')));
    this.set('availableQuantity', parseInt(this.get('availableQuantity')));

    if (this.get('status') !== TicketStatus.NotAvailable) {
      if (this.get('availableQuantity') === 0) {
        this.set('status', TicketStatus.OutOfStock);
      } else {
        this.set('status', TicketStatus.Available);
      }
    }

    done();
  }
});

ticketSchema.set('versionKey', 'version');

ticketSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return Ticket.findOne({
    _id: event.id,
    version: event.version - 1,
  });
};
ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket({
    _id: attrs.id,
    title: attrs.title,
    price: attrs.price,
    quantity: attrs.quantity,
    availableQuantity: attrs.availableQuantity,
  });
};
ticketSchema.methods.isReserved = async function () {
  const existingOrder = await Order.findOne({
    ticket: this as any,
    status: {
      $in: [
        OrderStatus.Created,
        OrderStatus.AwaitingPayment,
        OrderStatus.Complete,
      ],
    },
  });

  return !!existingOrder;
};

const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket', ticketSchema);

export { Ticket };
