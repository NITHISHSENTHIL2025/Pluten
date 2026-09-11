const crypto = require('crypto');
const prisma = require('../lib/prisma');
const recordAudit = require('../utils/auditLogger');
const { recordAnalyticsEvent } = require('../utils/analytics');

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

function emailOkay(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function makeTicketNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `PLU-${date}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function createSupportTicket(req, res) {
  try {
    const name = clean(req.body?.name || req.user?.firstName || '', 120);
    const email = clean(req.body?.email || req.user?.email || '', 320).toLowerCase();
    const category = clean(req.body?.category || 'GENERAL', 60).toUpperCase();
    const subject = clean(req.body?.subject, 180);
    const message = clean(req.body?.message, 5000);
    const orderReference = clean(req.body?.orderReference, 140) || null;

    if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
    if (!emailOkay(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (subject.length < 4) return res.status(400).json({ error: 'Please add a short subject.' });
    if (message.length < 10) return res.status(400).json({ error: 'Please describe how we can help.' });

    let ticket;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        ticket = await prisma.supportTicket.create({
          data: {
            ticketNumber: makeTicketNumber(),
            userId: req.user?.id || null,
            name,
            email,
            category,
            subject,
            message,
            orderReference,
          },
        });
        break;
      } catch (error) {
        if (error?.code !== 'P2002' || attempt === 2) throw error;
      }
    }

    await recordAnalyticsEvent({
      type: 'SUPPORT_TICKET_CREATED',
      visitorId: String(req.headers['x-analytics-visitor'] || (req.user ? `user:${req.user.id}` : `support:${ticket.id}`)).trim(),
      sessionKey: String(req.headers['x-analytics-session'] || '').trim() || null,
      userId: req.user?.id || null,
      metadata: { ticketNumber: ticket.ticketNumber, category },
    }).catch(() => null);

    return res.status(201).json({ success: true, ticketNumber: ticket.ticketNumber, message: 'Your support request has been received.' });
  } catch (error) {
    console.error('[SUPPORT] Ticket creation failed:', { requestId: req.requestId, message: error.message });
    return res.status(500).json({ error: 'Support request could not be created. Please try again.' });
  }
}

async function listSupportTickets(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
    const status = clean(req.query.status, 40);
    const where = status ? { status } : undefined;
    const [data, total] = await Promise.all([
      prisma.supportTicket.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.supportTicket.count({ where }),
    ]);
    return res.json({ data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    console.error('[SUPPORT] List failed:', error.message);
    return res.status(500).json({ error: 'Unable to retrieve support tickets.' });
  }
}

async function updateSupportTicket(req, res) {
  try {
    const allowed = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const status = clean(req.body?.status, 40).toUpperCase();
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid support status.' });
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status, resolvedAt: ['RESOLVED', 'CLOSED'].includes(status) ? new Date() : null },
    });
    await recordAudit({ userId: req.user.id, action: 'UPDATE_SUPPORT_TICKET', entity: 'SUPPORT_TICKET', entityId: ticket.id, details: { status, ticketNumber: ticket.ticketNumber }, req });
    return res.json({ success: true, ticket });
  } catch (error) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Support ticket not found.' });
    console.error('[SUPPORT] Update failed:', error.message);
    return res.status(500).json({ error: 'Unable to update support ticket.' });
  }
}

module.exports = { createSupportTicket, listSupportTickets, updateSupportTicket };
