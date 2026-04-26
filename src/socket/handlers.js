import { prisma } from '../db/index.js'

export const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id)

        socket.on('join-room', (roomId) => socket.join(roomId))
        socket.on('leave-room', (roomId) => socket.leave(roomId))

        socket.on('send-message', async (data) => {
            const { eventId, channelId, content, user } = data
            try {
                let dbUser = user.email
                    ? await prisma.user.findUnique({ where: { email: user.email } })
                    : await prisma.user.findUnique({ where: { id: user.id } })

                if (!dbUser && user.email) {
                    dbUser = await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || user.email.split('@')[0],
                            image: user.image || null,
                        },
                    }).catch(async () =>
                        prisma.user.findUnique({ where: { email: user.email } })
                    )
                }

                if (!dbUser) {
                    socket.emit('message-error', { error: 'User not found. Please log in again.' })
                    return
                }

                const message = await prisma.message.create({
                    data: { eventId, channelId: channelId || null, userId: dbUser.id, content },
                })

                io.to(channelId || eventId).emit('new-message', {
                    ...message,
                    userName: dbUser.name,
                    userImage: dbUser.image,
                })
            } catch (error) {
                console.error('Socket message error:', error)
                socket.emit('message-error', { error: 'Failed to send message' })
            }
        })

        socket.on('typing', ({ roomId, user }) => socket.to(roomId).emit('user-typing', { user }))
        socket.on('stop-typing', ({ roomId, user }) => socket.to(roomId).emit('user-stop-typing', { user }))
        socket.on('task-update', ({ eventId, task }) => io.to(eventId).emit('task-updated', task))
        socket.on('task-create', ({ eventId, task }) => io.to(eventId).emit('task-created', task))
        socket.on('member-added', ({ eventId, member }) => io.to(eventId).emit('member-joined', member))
        socket.on('member-removed', ({ eventId, memberId }) => io.to(eventId).emit('member-left', { memberId }))
        socket.on('expense-added', ({ eventId, expense }) => io.to(eventId).emit('expense-created', expense))
        socket.on('disconnect', () => console.log('User disconnected:', socket.id))
    })
}
