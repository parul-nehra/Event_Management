import { prisma } from '../db/index.js';

export const getMembers = async (c) => {
    const eventId = c.req.param('eventId');
    try {
        const members = await prisma.event_member.findMany({
            where: { eventId },
            include: { user: { select: { name: true, email: true, image: true } } },
        });
        return c.json(members.map(({ user, ...m }) => ({
            ...m,
            userName: user?.name ?? null,
            userEmail: user?.email ?? null,
            userImage: user?.image ?? null,
        })));
    } catch (error) {
        console.error('Error fetching members:', error);
        return c.json({ error: 'Failed to fetch members' }, 500);
    }
};

export const addMember = async (c) => {
    const eventId = c.req.param('eventId');
    try {
        const { userId, email, role, channelId } = await c.req.json();

        let targetUserId = userId;
        if (!targetUserId && email) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) return c.json({ error: 'User not found with this email' }, 404);
            targetUserId = user.id;
        }

        if (!targetUserId) return c.json({ error: 'userId or email is required' }, 400);

        const existing = await prisma.event_member.findFirst({ where: { eventId, userId: targetUserId } });
        if (existing) return c.json({ error: 'User is already a member of this event' }, 400);

        const member = await prisma.event_member.create({
            data: { eventId, userId: targetUserId, role: role || 'member', channelId: channelId || null },
            include: { user: { select: { name: true, email: true, image: true } } },
        });

        await prisma.activity.create({
            data: { eventId, userId: targetUserId, type: 'member_added', description: 'New member added to the event' },
        }).catch(() => {});

        const { user, ...rest } = member;
        return c.json({
            message: 'Member added successfully',
            member: { ...rest, userName: user?.name, userEmail: user?.email, userImage: user?.image },
        }, 201);
    } catch (error) {
        console.error('Error adding member:', error);
        return c.json({ error: 'Failed to add member' }, 500);
    }
};

export const updateMember = async (c) => {
    const id = c.req.param('id');
    try {
        const { role, channelId } = await c.req.json();
        await prisma.event_member.update({
            where: { id },
            data: {
                ...(role && { role }),
                ...(channelId !== undefined && { channelId }),
            },
        });
        return c.json({ message: 'Member updated successfully' });
    } catch (error) {
        console.error('Error updating member:', error);
        return c.json({ error: 'Failed to update member' }, 500);
    }
};

export const removeMember = async (c) => {
    const id = c.req.param('id');
    try {
        await prisma.event_member.delete({ where: { id } });
        return c.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing member:', error);
        return c.json({ error: 'Failed to remove member' }, 500);
    }
};
