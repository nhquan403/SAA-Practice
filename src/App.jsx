import { useState } from 'react'

const TABS = [
  { id: 1, label: 'Quiz 1', src: 'quizzes/quiz-1.html' },
  { id: 2, label: 'Quiz 2', src: 'quizzes/quiz-2.html' },
  { id: 3, label: 'Quiz 3', src: 'quizzes/quiz-3.html' },
  { id: 4, label: 'Quiz 4', src: 'quizzes/quiz-4.html' },
  { id: 5, label: 'Quiz 5', src: 'quizzes/quiz-5.html' },
  { id: 6, label: 'Quiz 6', src: 'quizzes/quiz-6.html' },
  { id: 'ref', label: '📘 Tài liệu', src: 'reference.html' },
]

export default function App() {
  const [active, setActive] = useState(1)
  const [loaded, setLoaded] = useState(() => new Set([1]))

  // Keep `selectTab` the only writer of `active`. Setting `active` without
  // also marking the tab loaded would render an empty stage with no error.
  function selectTab(id) {
    setActive(id)
    // Copy before adding: mutating `prev` in place would return the same
    // reference, React would bail out, and the new tab would never mount.
    setLoaded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }

  return (
    <div className="app">
      <div className="tabs" role="group" aria-label="Quizzes và tài liệu">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === active ? 'tab tab-active' : 'tab'}
            aria-current={t.id === active ? 'true' : undefined}
            onClick={() => selectTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/*
        A tab loads on first visit and then stays mounted, so switching tabs
        never discards the answers and score already entered in a quiz.

        Two invariants keep that true — breaking either silently wipes a user's
        progress, with no error and nothing in the console:

        1. `key={t.id}` must stay. Without it React reuses iframes positionally
           and rewrites `src`, reloading the document.
        2. Mounted tabs must keep a stable order matching TABS. Filtering a
           fixed list only ever appends, so React never re-inserts an existing
           node. Reordering (e.g. most-recent-first, or active-tab-first)
           reparents the iframe, and reparenting an iframe reloads it.

        Inactive frames are hidden with `visibility`, not `display: none`, which
        would destroy the layout box and reset the reader's scroll position.
      */}
      <div className="stage">
        {TABS.filter((t) => loaded.has(t.id)).map((t) => (
          <iframe
            key={t.id}
            className={t.id === active ? 'frame' : 'frame frame-inactive'}
            src={`${import.meta.env.BASE_URL}${t.src}`}
            title={t.label}
          />
        ))}
      </div>
    </div>
  )
}
