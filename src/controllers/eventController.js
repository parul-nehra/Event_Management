import { prisma } from '../db/index.js';

export const getEvents = async (c) => {
    try {
        const events = await prisma.event.findMany();
        return c.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        return c.json({ error: 'Failed to fetch events' }, 500);
    }
};

export const getEvent = async (c) => {
    const id = c.req.param('id');
    try {
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) return c.json({ error: 'Event not found' }, 404);
        return c.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        return c.json({ error: 'Failed to fetch event' }, 500);
    }
};

export const createEvent = async (c) => {
    try {
        const body = await c.req.json();
        const { title, description, date, location, budget, category, guestCount } = body;

        if (!title || !date) return c.json({ error: 'Title and Date are required' }, 400);

        const auth = c.get('authUser');
        if (!auth?.session?.user?.email) return c.json({ error: 'Authentication required to create events' }, 401);

        let organizer = await prisma.user.findUnique({ where: { email: auth.session.user.email } });
        if (!organizer) {
            organizer = await prisma.user.create({
                data: {
                    email: auth.session.user.email,
                    name: auth.session.user.name || auth.session.user.email.split('@')[0],
                    image: auth.session.user.image,
                },
            });
        }

        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                location,
                budget: budget ? Number(budget) : null,
                category,
                guestCount: guestCount ? Number(guestCount) : null,
                organizerId: organizer.id,
            },
        });

        return c.json({ message: 'Event created successfully', event }, 201);
    } catch (error) {
        console.error('Error creating event:', error);
        return c.json({ error: 'Failed to create event' }, 500);
    }
};

export const updateEvent = async (c) => {
    const id = c.req.param('id');
    try {
        const auth = c.get('authUser');
        if (!auth?.session?.user) return c.json({ error: 'Unauthorized' }, 401);

        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) return c.json({ error: 'Event not found' }, 404);
        if (auth.session.user.id !== event.organizerId) return c.json({ error: 'Unauthorized' }, 403);

        const body = await c.req.json();
        const { title, description, date, location, budget, category, guestCount } = body;

        const updated = await prisma.event.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(date && { date: new Date(date) }),
                ...(location && { location }),
                ...(budget && { budget: Number(budget) }),
                ...(category && { category }),
                ...(guestCount && { guestCount: Number(guestCount) }),
            },
        });

        return c.json({ message: 'Event updated successfully', event: updated });
    } catch (error) {
        console.error('Error updating event:', error);
        return c.json({ error: 'Failed to update event' }, 500);
    }
};

export const deleteEvent = async (c) => {
    const id = c.req.param('id');
    try {
        const auth = c.get('authUser');
        if (!auth?.session?.user) return c.json({ error: 'Unauthorized' }, 401);

        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) return c.json({ error: 'Event not found' }, 404);
        if (auth.session.user.id !== event.organizerId) return c.json({ error: 'Unauthorized' }, 403);

        await prisma.event.delete({ where: { id } });
        return c.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        return c.json({ error: 'Failed to delete event' }, 500);
    }
};

export const getEventStats = async (c) => {
    const eventId = c.req.param('eventId');
    try {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) return c.json({ error: 'Event not found' }, 404);

        const [taskStats, expenseStats, channelCount, memberCount] = await Promise.all([
            prisma.task.groupBy({
                by: ['status'],
                where: { eventId },
                _count: { status: true },
            }),
            prisma.expense.aggregate({
                where: { eventId },
                _sum: { amount: true },
            }),
            prisma.channel.count({ where: { eventId } }),
            prisma.event_member.count({ where: { eventId } }),
        ]);

        const approvedExpenses = await prisma.expense.aggregate({
            where: { eventId, status: 'approved' },
            _sum: { amount: true },
        });
        const pendingExpenses = await prisma.expense.aggregate({
            where: { eventId, status: 'pending' },
            _sum: { amount: true },
        });

        const totalTasks = taskStats.reduce((sum, s) => sum + s._count.status, 0);
        const completedTasks = taskStats.find(s => s.status === 'done')?._count.status || 0;
        const inProgressTasks = taskStats.find(s => s.status === 'in_progress')?._count.status || 0;
        const todoTasks = taskStats.find(s => s.status === 'todo')?._count.status || 0;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return c.json({
            event,
            tasks: { total: totalTasks, completed: completedTasks, inProgress: inProgressTasks, todo: todoTasks },
            budget: {
                total: Number(event.budget) || 0,
                spent: Number(approvedExpenses._sum.amount) || 0,
                pending: Number(pendingExpenses._sum.amount) || 0,
            },
            channels: channelCount,
            members: memberCount,
            progress,
        });
    } catch (error) {
        console.error('Error fetching event stats:', error);
        return c.json({ error: 'Failed to fetch event stats' }, 500);
    }
};
