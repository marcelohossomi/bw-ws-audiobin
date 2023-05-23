import './App.css'
import './assets/fonts.css'

import useWebSocket, { ReadyState } from 'react-use-websocket'

import { Stream } from './components/Stream'

function App() {
  const {
    lastJsonMessage: streams,
    sendJsonMessage: send,
    readyState
  } = useWebSocket(`ws://${process.env.REACT_APP_SERVER_HOST || window.location.host}/client`)

  return <div className='app'>
    <div className='top-bar'>
      <h1>Audiobin</h1>
      <span>{readyState === ReadyState.OPEN ? 'Connected' : 'Disconnected'}</span>
    </div>
    <h2>Bandwidth Programmable Voice</h2>
    <p>Visualize Bandwidth media streaming calls!</p>
    {streams && streams.map(stream => <Stream
      key={`${stream.callId}/${stream.name}`}
      stream={stream}
      onStop={() => {
        send({
          eventType: 'stop',
          callId: stream.callId,
          name: stream.name,
        })
      }} />)}
  </div>
}

export default App
