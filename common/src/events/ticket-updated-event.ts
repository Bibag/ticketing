import { Subjects } from './subjects';
import { TicketStatus } from './types/ticket-status';

export interface TicketUpdatedEvent {
  subject: Subjects.TicketUpdated;
  data: {
    id: string;
    version: number;
    title: string;
    price: number;
    quantity: number;
    availableQuantity: number;
    userId: string;
    status: TicketStatus;
    orderId?: string[];
  };
}
