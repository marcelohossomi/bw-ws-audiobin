import './Stream.css'

import { AudioView } from '../AudioView'
import { mulaw } from 'alawmulaw'

export const Stream = ({ stream, onStop }) => {
    return <div className={`stream ${stream.disabled ? 'disabled' : 'enabled'}`}>
        <div className='stream-header'>
            <h3>{stream.callId}</h3>
            <h3>{stream.name}</h3>
            <input type="button" value="x" disabled={stream.disabled} onClick={onStop} />
        </div>
        <div className='stream-tracks'>
            {stream.tracks.map(track => <AudioView
                key={`${stream.callId}/${stream.name}/${track.name}`}
                width="400" height="50"
                name={track.name}
                samples={Array.from(mulaw.decode(Buffer.from(track.samples, 'base64')))} />)}
        </div>
    </div>
}