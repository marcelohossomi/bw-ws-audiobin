import './App.css'
import './assets/fonts.css'
import { useState, useEffect, useCallback, useRef } from 'react'

import useWebSocket, { ReadyState } from 'react-use-websocket'

import { Stream } from './components/Stream'

function App() {
  const {
    lastJsonMessage: event
  } = useWebSocket(`ws://${process.env.REACT_APP_SERVER_HOST || window.location.host}/client`)

  const [eventQueue, setEventQueue] = useState([])
  const eventQueueRef = useRef(eventQueue)
  eventQueueRef.current = eventQueue

  const nextEvent = useCallback(() => {
    const eventQueue = eventQueueRef.current.slice(1)
    setEventQueue(eventQueue)
    console.log(`Removing one; remaining: ${eventQueue.length}`)
    if (eventQueue.length > 0) {
      scheduleNext(eventQueue[0])
    }
  }, [eventQueueRef])

  const scheduleNext = useCallback((event) => {
    const eventDuration = new Date(event.endTime).getTime() - new Date(event.startTime).getTime()
    setTimeout(nextEvent, eventDuration * 1.5)
  }, [nextEvent])

  useEffect(() => {
    if (event && event.eventType === 'transcription' && event.partial === false) {
      console.log(`Adding '${event.transcript}'; size: ${eventQueue.length + 1}`)
      setEventQueue([...eventQueue, event])
      if (eventQueue.length === 0) {
        scheduleNext(event)
      }
    }
  }, [event])

  return <div className='app'>
    {eventQueue.length > 0 ? <Speech text={eventQueue[0].transcript} label={eventQueue[0].track === 'inbound' ? 'Presenter' : 'Guest'} /> : null}
  </div>
}

function Speech({ text, label }) {
  return <div className='speech'>
    <video loop={true} autoPlay={true} muted={true}>
      <source src="speech.mp4" />
    </video>
    <h2 className='label'>{label}</h2>
    <h1 className='text'>{text}</h1>
  </div>
}

export default App
