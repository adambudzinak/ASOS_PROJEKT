/*
Purpose:
The goal of this setup is to load environment-specific configuration files (e.g., local.ts for local development and prod.ts 
for production) and merge them with default configuration values. This allows the application to behave differently depending
on the environment it's running in (development, production, etc.).
*/

import merge from 'lodash.merge'

//process.env.NODE_ENV is a standard environment variable used to specify the environment in which the application is running
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
//stage is a custom environment variable (process.env.STAGE) that specifies which environment configuration to load
const stage = process.env.STAGE || 'local'

let envConfig

if (stage === 'prod') {
    envConfig = require('./prod').default
} else {
    envConfig = require('./local').default
}

const defaultConfig = {
    stage,
    env: process.env.NODE_ENV,
    dbUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    port: process.env.PORT
}

export default merge(defaultConfig, envConfig)