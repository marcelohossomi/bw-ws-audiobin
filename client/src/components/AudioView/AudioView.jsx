import './AudioView.css'

import { useEffect, useRef } from 'react'

const MAX_VALUE = 32124 * 0.8

export const AudioView = ({ width, height, name, samples = [] }) => {
    const ref = useRef(null)

    const reset = (canvas, context) => {
        context.clearRect(0, 0, canvas.width, canvas.height)
    }

    const drawSamples = (canvas, context, samples) => {
        const step = canvas.width / (samples.length + 1)
        context.strokeStyle = '#FF0000'
        context.beginPath()
        context.moveTo(0, canvas.height / 2)
        samples
            .map(s => s / MAX_VALUE / 2)
            .forEach((s, i) => context.lineTo(
                (i + 1) * step,
                canvas.height / 2 - s * canvas.height))
        context.lineTo(canvas.width, canvas.height / 2)
        context.stroke()

        context.font = "10pt Overpass";
        context.fillStyle = "white";
        context.textAlign = "left";
        context.fillText(name, 5, 15)
        context.stroke()
    }

    useEffect(() => {
        const canvas = ref.current
        const context = canvas.getContext('2d')
        reset(canvas, context)
        drawSamples(canvas, context, samples)
    }, [samples])

    return <canvas ref={ref} width={width} height={height} />
}