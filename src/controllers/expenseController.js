import { prisma } from '../db/index.js';

export const getExpenses = async (c) => {
    const eventId = c.req.param('eventId');
    try {
        const expenses = await prisma.expense.findMany({ where: { eventId } });
        return c.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return c.json({ error: 'Failed to fetch expenses' }, 500);
    }
};

export const createExpense = async (c) => {
    const eventId = c.req.param('eventId');
    try {
        const { amount, description, category, channelId, date } = await c.req.json();
        if (!amount || !description) return c.json({ error: 'Amount and Description are required' }, 400);

        const expense = await prisma.expense.create({
            data: {
                eventId,
                amount: Number(amount),
                description,
                category: category || 'General',
                channelId: channelId || null,
                date: date ? new Date(date) : new Date(),
                status: 'pending',
            },
        });

        await prisma.activity.create({
            data: {
                eventId,
                type: 'expense_added',
                description: `Expense "${description}" ($${amount}) was added`,
                metadata: JSON.stringify({ amount, category }),
            },
        }).catch(() => {});

        return c.json({ message: 'Expense created', expense }, 201);
    } catch (error) {
        console.error('Error creating expense:', error);
        return c.json({ error: 'Failed to create expense' }, 500);
    }
};

export const updateExpense = async (c) => {
    const id = c.req.param('id');
    try {
        const { amount, description, category, channelId, status, date } = await c.req.json();
        const current = await prisma.expense.findUnique({ where: { id } });

        const updated = await prisma.expense.update({
            where: { id },
            data: {
                ...(amount !== undefined && { amount: Number(amount) }),
                ...(description && { description }),
                ...(category && { category }),
                ...(channelId !== undefined && { channelId }),
                ...(status && { status }),
                ...(date && { date: new Date(date) }),
            },
        });

        if (current && status === 'approved' && current.status !== 'approved') {
            await prisma.activity.create({
                data: {
                    eventId: current.eventId,
                    type: 'expense_approved',
                    description: `Expense "${current.description}" was approved`,
                },
            }).catch(() => {});
        }

        return c.json({ message: 'Expense updated', expense: updated });
    } catch (error) {
        console.error('Error updating expense:', error);
        return c.json({ error: 'Failed to update expense' }, 500);
    }
};

export const deleteExpense = async (c) => {
    const id = c.req.param('id');
    try {
        await prisma.expense.delete({ where: { id } });
        return c.json({ message: 'Expense deleted' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return c.json({ error: 'Failed to delete expense' }, 500);
    }
};
