import { Hono } from 'hono'
import { prisma } from '../db/index.js'
import bcrypt from 'bcryptjs'
import { requireAuth } from '../middleware/auth.js'

const users = new Hono()

users.post('/register', async (c) => {
    try {
        const { name, email, password } = await c.req.json()
        if (!email || !password) return c.json({ error: 'Email and password are required' }, 400)
        if (password.length < 6) return c.json({ error: 'Password must be at least 6 characters' }, 400)

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) return c.json({ error: 'User with this email already exists' }, 400)

        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.create({
            data: { name: name || email.split('@')[0], email, password: hashedPassword },
        })
        return c.json({ message: 'User registered successfully' }, 201)
    } catch (error) {
        console.error('Registration error:', error)
        return c.json({ error: 'Failed to register user' }, 500)
    }
})

users.get('/me', requireAuth, async (c) => {
    try {
        const user = c.get('user')
        if (!user?.email) return c.json({ error: 'Unauthorized' }, 401)

        const record = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, name: true, email: true, image: true, phone: true, location: true, bio: true, role: true },
        })
        if (!record) return c.json({ error: 'User not found' }, 404)
        return c.json(record)
    } catch (error) {
        console.error('Error fetching user:', error)
        return c.json({ error: 'Failed to fetch user' }, 500)
    }
})

users.put('/me', requireAuth, async (c) => {
    try {
        const user = c.get('user')
        if (!user?.email) return c.json({ error: 'Unauthorized' }, 401)

        const { name, image, phone, location, bio, role } = await c.req.json()
        const updated = await prisma.user.update({
            where: { email: user.email },
            data: {
                ...(name !== undefined && { name }),
                ...(image !== undefined && { image }),
                ...(phone !== undefined && { phone }),
                ...(location !== undefined && { location }),
                ...(bio !== undefined && { bio }),
                ...(role !== undefined && { role }),
            },
            select: { id: true, name: true, email: true, image: true, phone: true, location: true, bio: true, role: true },
        })
        return c.json({ message: 'Profile updated', user: updated })
    } catch (error) {
        console.error('Error updating user:', error)
        return c.json({ error: 'Failed to update user' }, 500)
    }
})

users.get('/search/:email', requireAuth, async (c) => {
    const email = c.req.param('email')
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true, image: true },
        })
        if (!user) return c.json({ error: 'User not found' }, 404)
        return c.json(user)
    } catch (error) {
        console.error('Error searching user:', error)
        return c.json({ error: 'Failed to search user' }, 500)
    }
})

users.get('/:id', async (c) => {
    const id = c.req.param('id')
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, image: true },
        })
        if (!user) return c.json({ error: 'User not found' }, 404)
        return c.json(user)
    } catch (error) {
        console.error('Error fetching user:', error)
        return c.json({ error: 'Failed to fetch user' }, 500)
    }
})

export default users
