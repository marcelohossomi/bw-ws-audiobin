import './SubtitlesPage.css'
import './assets/fonts.css'
import { useState, useEffect, useCallback, useRef } from 'react'

import useWebSocket from 'react-use-websocket'

export default function ({ switchPage }) {
  const {
    lastJsonMessage: event
  } = useWebSocket(`ws://${process.env.REACT_APP_SERVER_HOST || window.location.host}/client`)

  const [words, setWords] = useState([])

  useEffect(() => {
    if (event && event.eventType === 'transcription') {
      const words = []
      for (const item of event.items) {
        if (item.type === 'PRONUNCIATION') {
          words.push(item.content)
        } else if (item.type === 'PUNCTUATION') {
          words[words.length - 1] = words[words.length - 1] + item.content
        }
      }
      setWords(words)
    }
  }, [event])

  return <div className='app'>
    <input type='button' value='To film' onClick={switchPage} />
    <Speech text={words.join(' ')} />
  </div>
}

function Speech({ text }) {
  return <div className='subtitles'>
    <h1 className='text'>{text}</h1>
  </div>
}
