require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')
const authRouter = require('./routes/auth')
const leaveRouter = require('./routes/leave')
const reportRouter = require('./routes/report')
const holidayRouter = require('./routes/holiday')
const entitlementRouter = require('./routes/entitlement')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/leave', leaveRouter)
app.use('/api/report', reportRouter)
app.use('/api/holiday', holidayRouter)
app.use('/api/entitlement', entitlementRouter)

const PORT = process.env.PORT || 4000
app.listen(PORT, ()=> console.log(`Server running on ${PORT}`))