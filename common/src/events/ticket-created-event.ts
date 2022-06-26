import { Subjects } from './subjects';
import { TicketStatus } from './types/ticket-status';

export interface TicketCreatedEvent {
  subject: Subjects.TicketCreated;
  data: {
    id: string;
    version: number;
    title: string;
    price: number;
    quantity: number;
    availableQuantity: number;
    userId: string;
    status: TicketStatus;
  };
}
