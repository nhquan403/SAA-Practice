import { useState } from 'react'

const QUIZZES = [1, 2, 3, 4, 5, 6]

export default function App() {
  const [active, setActive] = useState(1)
  const [loaded, setLoaded] = useState(() => new Set([1]))

  // Keep `selectQuiz` the only writer of `active`. Setting `active` without
  // also marking the quiz loaded would render an empty stage with no error.
  function selectQuiz(n) {
    setActive(n)
    // Copy before adding: mutating `prev` in place would return the same
    // reference, React would bail out, and the new quiz would never mount.
    setLoaded((prev) => (prev.has(n) ? prev : new Set(prev).add(n)))
  }

  return (
    <div className="app">
      <div className="tabs" role="group" aria-label="Quizzes">
        {QUIZZES.map((n) => (
          <button
            key={n}
            type="button"
            className={n === active ? 'tab tab-active' : 'tab'}
            aria-current={n === active ? 'true' : undefined}
            onClick={() => selectQuiz(n)}
          >
            Quiz {n}
          </button>
        ))}
      </div>

      {/*
        A quiz loads on first visit and then stays mounted, so switching tabs
        never discards the answers and score already entered in it.

        Two invariants keep that true — breaking either silently wipes a user's
        progress, with no error and nothing in the console:

        1. `key={n}` must stay. Without it React reuses iframes positionally and
           rewrites `src`, reloading the document.
        2. Mounted quizzes must keep a stable ascending order. Filtering a fixed
           list only ever appends, so React never re-inserts an existing node.
           Reordering (e.g. most-recent-first, or active-tab-first) reparents the
           iframe, and reparenting an iframe reloads it.

        Inactive frames are hidden with `visibility`, not `display: none`, which
        would destroy the layout box and reset the reader's scroll position.
      */}
      <div className="stage">
        {QUIZZES.filter((n) => loaded.has(n)).map((n) => (
          <iframe
            key={n}
            className={n === active ? 'frame' : 'frame frame-inactive'}
            src={`${import.meta.env.BASE_URL}quizzes/quiz-${n}.html`}
            title={`Quiz ${n}`}
          />
        ))}
      </div>
    </div>
  )
}
