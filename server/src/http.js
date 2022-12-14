import chalk from 'chalk'
import express from 'express'
import fs from 'fs'
import handlebars from 'handlebars'
import { port } from './config'

const app = express()
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(express.static('../client/build'))

app.use('/bxml/*', (req, res) => {
  try {
    const name = req.baseUrl.substring(6)
    const bxml = fs.readFileSync(`bxml/${name}.xml`, 'utf8')
    const template = handlebars.compile(bxml)

    logEvent(req, 'blue')
    res.send(template({ env: process.env }))
  } catch (e) {
    res.sendStatus(404)
  }
})

app.use('/**', (req, res) => {
  logEvent(req, 'green')
  res.sendStatus(200)
})

export const http = app
  .listen(port, () => console.log(`HTTP listening on port ${port}`))

function logEvent(req, color) {
  const event = req.body
  const attributes = {
    'Event Type': event.eventType,
    'Call': `${event.accountId}/${event.callId}`,
    'Host': event.callUrl.substring(event.callUrl.indexOf('//') + 2, event.callUrl.indexOf('/accounts'))
  }
  if (event.cause) {
    attributes['Cause'] = event.cause === 'hangup'
      ? chalk.yellow(event.cause)
      : `${chalk.red(event.cause)} (${event.errorMessage || 'Unknown'})`
  }

  const maxKeySize = Object.keys(attributes)
    .map(k => k.length)
    .reduce((max, cur) => cur > max ? cur : max, 0)
  const fg = chalk[color]
  const br = chalk[`${color}Bright`]
  const bg = chalk[`bg${color.charAt(0).toUpperCase()}${color.substring(1)}`]
  const bar = bg(' ')

  console.log(`\n${bar} ${br(req.method)} ${fg(req.baseUrl)}\n` + Object.entries(attributes)
    .map(([key, value]) => `${bar} ${key.padEnd(maxKeySize)} : ${value}`).join('\n'))
}