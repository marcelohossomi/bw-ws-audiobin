import './App.css'
import './assets/fonts.css'
import { useState, useEffect, useCallback, useRef } from 'react'

import SilentFilmPage from './SilentFilmPage'
import SubtitlesPage from './SubtitlesPage'

export default function () {
    const [page, setPage] = useState('film')
    switch (page) {
        case 'subs': return <SubtitlesPage switchPage={() => setPage('film')} />
        default: return <SilentFilmPage switchPage={() => setPage('subs')} />
    }

}