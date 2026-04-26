import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './src/lib/auth.js'

import events from './src/routes/events.js'
import usersRoute from './src/routes/users.js'
import emailRoute from './src/routes/email.js'

const app = new Hono()
const PORT = process.env.PORT || 3000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use('*', logger())

const allowedOrigins = [
    FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:3000',
    'https://event-managment-rho.vercel.app',
    'https://event-managment-sgg2.vercel.app',
]
if (process.env.ALLOWED_ORIGINS) {
    allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','))
}

app.use('*', cors({
    origin: allowedOrigins,
    credentials: true,
}))

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))

app.use('*', async (c, next) => {
    if (c.req.path.startsWith('/api/auth')) return next()
    try {
        const session = await auth.api.getSession({ headers: c.req.raw.headers })
        c.set('user', session?.user ?? null)
        c.set('session', session?.session ?? null)
    } catch {
        c.set('user', null)
        c.set('session', null)
    }
    return next()
})

app.route('/api/events', events)
app.route('/api/users', usersRoute)
app.route('/api/email', emailRoute)

app.get('/', (c) => c.text('EventFlow API'))

// Local dev server only
if (process.env.NODE_ENV !== 'production') {
    const { serve } = await import('@hono/node-server')
    serve({ fetch: app.fetch, port: PORT })
    console.log(`Server running on port ${PORT}`)
}

export default app
