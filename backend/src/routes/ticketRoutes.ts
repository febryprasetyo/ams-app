import { Router } from 'express';
import {
  getTicketCategories,
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addTicketComment,
} from '../controllers/ticketController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all ticket routes with authentication
router.use(authenticateToken);

// --- Ticket Categories ---
router.get('/categories', getTicketCategories);

// --- IT Tickets CRUD & Comments ---
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.post('/:id/comments', addTicketComment);

export default router;
