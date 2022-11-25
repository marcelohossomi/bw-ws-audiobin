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
                    const stream = {
                        callId: event.metadata.callId,
                        name: event.metadata.streamName,
                        params: event.streamParams,
                        tracks: event.metadata.tracks.map((track) => ({
                            name: track.name,
                            samples: Buffer.alloc(0)
                        })),
                        ws
                    }
                    state.streams = [...state.streams, stream]
                    if (!state.timer) {
                        state.timer = setInterval(broadcast, 100)
                    }
                    return stream
                },

                stop() {
                    // Do nothing
                },

                media(event, stream) {
                    const track = stream.tracks.find(t => t.name === event.track)
                    if (track) {
                        track.samples = Buffer.concat([
                            track.samples,
                            Buffer.from(event.payload, 'base64')
                        ])
                    }
                }
            }).then(({ state: stream }) => {
                state.streams = state.streams.filter(s => s !== stream)
                if (state.streams.length === 0 && state.timer) {
                    clearInterval(state.timer)
                    broadcast()
                    delete state.timer
                }
                stream.tracks.forEach((track) => writeWav(`${stream.name}-${track.name}`, track.samples))
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

function broadcast() {
    const data = JSON.stringify(state.streams.map(stream => ({
        callId: stream.callId,
        name: stream.name,
        params: stream.params,
        tracks: stream.tracks.map((track) => ({
            name: track.name,
            samples: track.samples.subarray(-5000).toString('base64')
        }))
    })))
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