import { prisma } from '../db/index.js';

export const getMessages = async (c) => {
    const eventId = c.req.param('eventId');
    const channelId = c.req.query('channelId');
    try {
        const messages = await prisma.message.findMany({
            where: { eventId, ...(channelId && { channelId }) },
            include: { user: { select: { name: true, email: true, image: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return c.json(messages.reverse().map(({ user, ...m }) => ({
            ...m,
            userName: user?.name ?? null,
            userEmail: user?.email ?? null,
            userImage: user?.image ?? null,
        })));
    } catch (error) {
        console.error('Error fetching messages:', error);
        return c.json({ error: 'Failed to fetch messages' }, 500);
    }
};

export const createMessage = async (c) => {
    const eventId = c.req.param('eventId');
    try {
        const { content, channelId } = await c.req.json();
        if (!content?.trim()) return c.json({ error: 'Message content is required' }, 400);

        const auth = c.get('authUser');
        if (!auth?.session?.user?.email) return c.json({ error: 'User not authenticated' }, 401);

        const user = await prisma.user.findUnique({ where: { email: auth.session.user.email } });
        if (!user) return c.json({ error: 'User not authenticated' }, 401);

        const message = await prisma.message.create({
            data: { eventId, channelId: channelId || null, userId: user.id, content: content.trim() },
        });

        return c.json({
            message: 'Message sent',
            data: { ...message, userName: user.name, userImage: user.image, createdAt: message.createdAt },
        }, 201);
    } catch (error) {
        console.error('Error creating message:', error);
        return c.json({ error: 'Failed to send message' }, 500);
    }
};

export const deleteMessage = async (c) => {
    const id = c.req.param('id');
    try {
        await prisma.message.delete({ where: { id } });
        return c.json({ message: 'Message deleted' });
    } catch (error) {
        console.error('Error deleting message:', error);
        return c.json({ error: 'Failed to delete message' }, 500);
    }
};
