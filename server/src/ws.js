import { WebSocketServer } from 'ws'
import _ from 'lodash'
import chalk from 'chalk'
import fs from 'fs'
import { http } from './http'
import { transcode } from 'buffer'

const state = {
    clients: [],
    streams: []
}

const wss = new WebSocketServer({
    server: http,
    clientTracking: true
})

wss.on('listening', () => console.log(`WebSocket listening at ${http.address().port}`))

wss.on('connection', (ws, request) => {
    switch (request.url) {
        case '/client': {
            state.clients = [...state.clients, ws]
            createHandler(ws, {
                close() {
                    state.clients = state.clients.filter(c => c !== ws)
                },

                stop(event) {
                    const stream = _.find(state.streams, { callId: event.callId, name: event.name })
                    if (stream) {
                        stream.ws.close(1000)
                    }
                }
            })
            break
        }
        case '/audio': {
            createHandler(ws, {
                start(event) {
                    broadcast(event)
                },

                stop(event) {
                    broadcast(event)
                },

                media(event, stream) {
                    // Do nothing
                },

                transcription(event, stream) {
                    broadcast(event)
                }
            })
            break
        }
        default: {
            console.log('Unknown connection path', request.url)
            ws.close(1000)
        }
    }
})

function createHandler(ws, handlers, initialState = {}) {
    return new Promise((resolve) => {
        let state = initialState
        ws.on('message', message => {
            const event = JSON.parse(message.toString('utf-8'))
            const handler = handlers[event.eventType]
            if (handler) {
                state = handler(event, state, ws) || state
            } else {
                console.log(`Received unknown event type ${event.eventType} (known types: ${Object.keys(handlers)})`)
            }
        })
        ws.on('close', () => resolve({ state, ws }))
    })
}

function broadcast(event) {
    const data = JSON.stringify(event)
    state.clients.forEach(ws => ws.send(data))
}

function writeWav(name, samples) {
    const now = new Date().toISOString()
        .replaceAll(/[-:.]/g, '')
        .replaceAll('T', '-')
    const fileName = `wav/${name}-${now}.wav`
    const header = Buffer.alloc(44)

    console.log(chalk.gray(`Writing ${samples.length}B to ${fileName}`))
    header.write('RIFF', 0, 'utf-8')
    header.writeUInt32LE(samples.length + 44 - 8, 4)
    header.write('WAVE', 8, 'utf-8')
    header.write('fmt ', 12, 'utf-8')
    header.writeUInt32LE(16, 16)
    header.writeUInt16LE(7, 20)
    header.writeUInt16LE(1, 22)
    header.writeUInt32LE(8000, 24)
    header.writeUInt32LE(8000, 28)
    header.writeUInt16LE(1, 32)
    header.writeUInt16LE(8, 34)
    header.write('data', 36, 'utf-8')
    header.writeUInt32LE(samples.length, 40)
    fs.writeFileSync(fileName, Buffer.concat([header, samples]))
}