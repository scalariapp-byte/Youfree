import { useRef, useState, type ReactNode } from 'react'

/** Liste réordonnable au doigt : maintenir la poignée ⠿ et glisser. */
export function DragList<T>({ items, keyOf, onChange, render }: { items: T[]; keyOf: (t: T) => string; onChange: (l: T[]) => void; render: (t: T) => ReactNode }) {
  const [drag, setDrag] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const move = (y: number) => {
    const i = refs.current.findIndex((el) => {
      const r = el?.getBoundingClientRect()
      return r && y >= r.top && y <= r.bottom
    })
    if (i >= 0) setOver(i)
  }
  const drop = () => {
    if (drag !== null && over !== null && drag !== over) {
      const l = [...items]
      const [x] = l.splice(drag, 1)
      l.splice(over, 0, x)
      onChange(l)
    }
    setDrag(null)
    setOver(null)
  }
  return (
    <div className="drag-list">
      {items.map((t, i) => (
        <div key={keyOf(t)} ref={(el) => void (refs.current[i] = el)} className={`drag-item ${drag === i ? 'dragging' : ''} ${over === i && drag !== i ? 'over' : ''}`}>
          <span
            className="drag-handle"
            onPointerDown={(e) => (e.currentTarget.setPointerCapture(e.pointerId), setDrag(i), setOver(i))}
            onPointerMove={(e) => drag !== null && move(e.clientY)}
            onPointerUp={drop}
            onPointerCancel={drop}
          >
            ⠿
          </span>
          {render(t)}
        </div>
      ))}
    </div>
  )
}
