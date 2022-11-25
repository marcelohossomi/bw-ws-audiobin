import config from 'dotenv/config' // Enforce loading .env as soon as possible

export const port = parseInt(process.argv[2]) || process.env.PORT || 5000