import mongoose from 'mongoose';
import { TicketStatus } from '@mrltickets/common';

interface TicketAttrs {
  title: string;
  price: number;
  quantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  userId: string;
  status: TicketStatus;
}

interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  quantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  userId: string;
  version: number;
  orderId?: string[];
  status: TicketStatus;
  availableQuantity(): number;
}

interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
}

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    reservedQuantity: {
      type: Number,
      min: 0,
    },
    soldQuantity: {
      type: Number,
      min: 0,
    },
    userId: {
      type: String,
      required: true,
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
        ret.availableQuantity = doc.availableQuantity();
      },
    },
    optimisticConcurrency: true,
    timestamps: true,
  }
);

ticketSchema.pre('save', async function (done) {
  if (
    this.isModified('quantity') ||
    this.isModified('reservedQuantity') ||
    this.isModified('soldQuantity')
  ) {
    this.set('quantity', parseInt(this.get('quantity')));
    this.set('reservedQuantity', parseInt(this.get('reservedQuantity')));
    this.set('soldQuantity', parseInt(this.get('soldQuantity')));

    if (this.get('status') !== TicketStatus.NotAvailable) {
      if (
        this.get('quantity') -
          this.get('reservedQuantity') -
          this.get('soldQuantity') ===
        0
      ) {
        this.set('status', TicketStatus.OutOfStock);
      } else {
        this.set('status', TicketStatus.Available);
      }
    }
  }

  done();
});

ticketSchema.set('versionKey', 'version');

ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket(attrs);
};
ticketSchema.methods.availableQuantity = function () {
  return this.quantity - (this.reservedQuantity + this.soldQuantity);
};

const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket', ticketSchema);

export { Ticket };
