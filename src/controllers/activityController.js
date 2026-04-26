import { prisma } from '../db/index.js';

export const getActivities = async (c) => {
    const eventId = c.req.param('eventId');
    try {
        const activities = await prisma.activity.findMany({
            where: { eventId },
            include: { user: { select: { name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return c.json(activities.map(({ user, ...a }) => ({
            ...a,
            userName: user?.name ?? null,
            userImage: user?.image ?? null,
        })));
    } catch (error) {
        console.error('Error fetching activities:', error);
        return c.json({ error: 'Failed to fetch activities' }, 500);
    }
};

export const createActivity = async ({ eventId, userId, type, description, metadata }) => {
    try {
        await prisma.activity.create({
            data: {
                eventId,
                userId,
                type,
                description,
                metadata: metadata ? JSON.stringify(metadata) : null,
            },
        });
    } catch (error) {
        console.error('Error creating activity:', error);
    }
};
