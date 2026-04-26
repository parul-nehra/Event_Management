import { prisma } from '../db/index.js';

export const getTasks = async (c) => {
    const eventId = c.req.param('eventId');
    try {
        const tasks = await prisma.task.findMany({
            where: { eventId },
            include: { assignee: { select: { name: true, image: true } } },
        });
        return c.json(tasks.map(({ assignee, ...t }) => ({
            ...t,
            assigneeName: assignee?.name ?? null,
            assigneeImage: assignee?.image ?? null,
        })));
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return c.json({ error: 'Failed to fetch tasks' }, 500);
    }
};

export const createTask = async (c) => {
    const eventId = c.req.param('eventId');
    try {
        const { title, description, channelId, assigneeId, priority, dueDate, status } = await c.req.json();
        if (!title) return c.json({ error: 'Title is required' }, 400);

        const task = await prisma.task.create({
            data: {
                eventId,
                title,
                description,
                channelId: channelId || null,
                assigneeId: assigneeId || null,
                priority: priority || 'medium',
                dueDate: dueDate ? new Date(dueDate) : null,
                status: status || 'todo',
            },
        });

        await prisma.activity.create({
            data: { eventId, type: 'task_created', description: `Task "${title}" was created` },
        }).catch(() => {});

        return c.json({ message: 'Task created', task }, 201);
    } catch (error) {
        console.error('Error creating task:', error);
        return c.json({ error: 'Failed to create task' }, 500);
    }
};

export const updateTask = async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const current = await prisma.task.findUnique({ where: { id } });

        const { id: _id, eventId: _eid, createdAt: _ca, ...updateData } = body;
        if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

        await prisma.task.update({ where: { id }, data: updateData });

        if (current && body.status === 'done' && current.status !== 'done') {
            await prisma.activity.create({
                data: {
                    eventId: current.eventId,
                    type: 'task_completed',
                    description: `Task "${current.title}" was completed`,
                },
            }).catch(() => {});
        }

        return c.json({ message: 'Task updated' });
    } catch (error) {
        console.error('Error updating task:', error);
        return c.json({ error: 'Failed to update task' }, 500);
    }
};

export const deleteTask = async (c) => {
    const id = c.req.param('id');
    try {
        await prisma.task.delete({ where: { id } });
        return c.json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Error deleting task:', error);
        return c.json({ error: 'Failed to delete task' }, 500);
    }
};
