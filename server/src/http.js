import chalk from 'chalk'
import express from 'express'
import fs from 'fs'
import handlebars from 'handlebars'
import { port } from './config'
import { highlight, fromJson } from 'cli-highlight'

const jsonTheme = fromJson({
  attr: ['green', 'bold'],
  string: 'cyan',
  number: 'magenta',
  default: 'gray'
})

const app = express()
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(express.static('../client/build'))

app.use('/bxml/*', (req, res) => {
  try {
    const name = req.baseUrl.substring(6)
    const bxml = fs.readFileSync(`bxml/${name}.xml`, 'utf8')
    const template = handlebars.compile(bxml)

    logCallback(req, 'green')
    res.send(template({ env: process.env }))
  } catch (e) {
    res.sendStatus(404)
  }
})

app.use(['/callbacks', '/callbacks/**'], (req, res) => {
  logCallback(req, 'blue')
  res.sendStatus(200)
})

app.use('/**', (req, res) => {
  logRaw(req, 'yellow')
  res.sendStatus(200)
})

export const http = app
  .listen(port, () => console.log(`HTTP listening on port ${port}`))

function logCallback(req, color) {
  const event = req.body

  const attributes = {
    'Event Type': event.eventType,
    'Account': event.accountId,
    'Call': event.callId,
    'Conference': event.conferenceId,
    'Endpoints': event.from && event.to ? `${event.from} > ${event.to}` : undefined,
    'URL': event.callUrl ? event.callUrl.substring(0, event.callUrl.indexOf('/accounts')) : undefined
  }

  if (event.cause) {
    attributes['Cause'] = statusColor(event.cause, event.errorMessage, ['hangup', 'closed'])
  }
  if (event.eventType === 'recordingAvailable') {
    attributes['Recording'] = event.recordingId
    attributes['Status'] = statusColor(event.status, event.errorMessage, ['complete'], ['partial'])
  }
  if (event.eventType === 'transcriptionAvailable') {
    attributes['Recording'] = event.recordingId
    attributes['Status'] = statusColor(event.transcription.status, event.transcription.errorMessage, ['available'])
  }
  if (event.eventType === 'machineDetectionComplete') {
    attributes['AMD'] = `${event.machineDetectionResult.value} (${event.machineDetectionResult.duration})`
  }

  const maxKeySize = Object.keys(attributes)
    .filter(k => attributes[k])
    .map(k => k.length)
    .reduce((max, cur) => cur > max ? cur : max, 0)
  const fg = chalk[color]
  const br = chalk[`${color}Bright`]
  const bg = chalk[`bg${color.charAt(0).toUpperCase()}${color.substring(1)}`]
  const bar = bg(' ')

  console.log(`\n${bar} ${br(req.method)} ${fg(req.baseUrl)}\n` + Object.entries(attributes)
    .filter(([key, value]) => value)
    .map(([key, value]) => `${bar} ${key.padEnd(maxKeySize)} : ${value}`).join('\n'))
}


function logRaw(req, color) {
  const event = JSON.stringify(req.body, null, 2)
  const fg = chalk[color]
  const br = chalk[`${color}Bright`]
  const bg = chalk[`bg${color.charAt(0).toUpperCase()}${color.substring(1)}`]
  const bar = bg(' ')

  console.log(`\n${bar} ${br(req.method)} ${fg(req.baseUrl)}\n`
    + highlight(event, { language: 'json', theme: jsonTheme }).replace(/^|\n/g, `$&${bar} `))
}

function statusColor(status, errorMessage, success = [], warning = []) {
  if (success.includes(status)) return chalk.greenBright(status)
  if (warning.includes(status)) return `${chalk.yellowBright(status)} (${errorMessage || 'Unknown'})`
  return `${chalk.redBright(status)} (${errorMessage || 'Unknown'})`
}