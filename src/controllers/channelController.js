import { prisma } from '../db/index.js';

export const getChannels = async (c) => {
    const eventId = c.req.param('eventId');
    try {
        const channels = await prisma.channel.findMany({
            where: { eventId },
            include: {
                subgroups: true,
                tasks: { select: { status: true } },
            },
        });

        return c.json(channels.map(({ tasks, ...ch }) => ({
            ...ch,
            taskCount: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'done').length,
        })));
    } catch (error) {
        console.error('Error fetching channels:', error);
        return c.json({ error: 'Failed to fetch channels' }, 500);
    }
};

export const createChannel = async (c) => {
    const eventId = c.req.param('eventId');
    try {
        const { name, description, icon, color } = await c.req.json();
        if (!name) return c.json({ error: 'Name is required' }, 400);

        const channel = await prisma.channel.create({
            data: {
                eventId,
                name,
                description: description || '',
                icon: icon || 'Users',
                color: color || 'bg-[#ffcc00]',
            },
        });

        await prisma.activity.create({
            data: { eventId, type: 'channel_created', description: `Channel "${name}" was created` },
        }).catch(() => {});

        return c.json({ message: 'Channel created', channel: { ...channel, subgroups: [] } }, 201);
    } catch (error) {
        console.error('Error creating channel:', error);
        return c.json({ error: 'Failed to create channel' }, 500);
    }
};

export const updateChannel = async (c) => {
    const id = c.req.param('id');
    try {
        const { name, description, icon, color } = await c.req.json();
        await prisma.channel.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(icon && { icon }),
                ...(color && { color }),
            },
        });
        return c.json({ message: 'Channel updated' });
    } catch (error) {
        console.error('Error updating channel:', error);
        return c.json({ error: 'Failed to update channel' }, 500);
    }
};

export const deleteChannel = async (c) => {
    const id = c.req.param('id');
    try {
        await prisma.channel.delete({ where: { id } });
        return c.json({ message: 'Channel deleted' });
    } catch (error) {
        console.error('Error deleting channel:', error);
        return c.json({ error: 'Failed to delete channel' }, 500);
    }
};

export const createSubgroup = async (c) => {
    const channelId = c.req.param('channelId');
    try {
        const { name, members } = await c.req.json();
        if (!name) return c.json({ error: 'Name is required' }, 400);

        const subgroup = await prisma.subgroup.create({
            data: { channelId, name, members: members || 1 },
        });
        return c.json({ message: 'Subgroup created', subgroup }, 201);
    } catch (error) {
        console.error('Error creating subgroup:', error);
        return c.json({ error: 'Failed to create subgroup' }, 500);
    }
};

export const updateSubgroup = async (c) => {
    const id = c.req.param('id');
    try {
        const { name, members } = await c.req.json();
        await prisma.subgroup.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(members !== undefined && { members }),
            },
        });
        return c.json({ message: 'Subgroup updated' });
    } catch (error) {
        console.error('Error updating subgroup:', error);
        return c.json({ error: 'Failed to update subgroup' }, 500);
    }
};

export const deleteSubgroup = async (c) => {
    const id = c.req.param('id');
    try {
        await prisma.subgroup.delete({ where: { id } });
        return c.json({ message: 'Subgroup deleted' });
    } catch (error) {
        console.error('Error deleting subgroup:', error);
        return c.json({ error: 'Failed to delete subgroup' }, 500);
    }
};
