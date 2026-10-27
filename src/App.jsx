import { useEffect, useState } from 'react'

function quizTabs(dir) {
  return [1, 2, 3, 4, 5, 6].map((n) => ({
    id: n,
    label: `Quiz ${n}`,
    src: `${dir}quizzes/quiz-${n}.html`,
  }))
}

const COURSES = [
  {
    id: 'saa',
    label: 'AWS SAA',
    title: 'AWS SAA Practice',
    tabs: [...quizTabs(''), { id: 'ref', label: '📘 Tài liệu', src: 'reference.html' }],
  },
  {
    id: 'claude',
    label: 'Claude Developer',
    title: 'Claude Developer Practice',
    tabs: [
      ...quizTabs('claude-dev/'),
      { id: 'ref', label: '📘 Tài liệu', src: 'claude-dev/reference.html' },
    ],
  },
]

// Every tab of every course in one fixed order; `key` is unique across courses.
const ALL_TABS = COURSES.flatMap((c) =>
  c.tabs.map((t) => ({ ...t, course: c.id, key: `${c.id}:${t.id}` })),
)

const FIRST_KEY = ALL_TABS[0].key

export default function App() {
  const [courseId, setCourseId] = useState(COURSES[0].id)
  // Last tab opened in each course, so switching course and back returns to it.
  const [activeByCourse, setActiveByCourse] = useState(() =>
    Object.fromEntries(COURSES.map((c) => [c.id, `${c.id}:${c.tabs[0].id}`])),
  )
  const [loaded, setLoaded] = useState(() => new Set([FIRST_KEY]))

  const course = COURSES.find((c) => c.id === courseId)
  const activeKey = activeByCourse[courseId]

  useEffect(() => {
    document.title = course.title
  }, [course])

  // Keep `selectTab` the only writer of the active tab. Activating a tab
  // without also marking it loaded would render an empty stage with no error.
  function selectTab(key) {
    const tabCourse = key.split(':')[0]
    setCourseId(tabCourse)
    setActiveByCourse((prev) => ({ ...prev, [tabCourse]: key }))
    // Copy before adding: mutating `prev` in place would return the same
    // reference, React would bail out, and the new tab would never mount.
    setLoaded((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
  }

  return (
    <div className="app">
      <div className="tabs tabs-courses" role="group" aria-label="Khoá học">
        {COURSES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={c.id === courseId ? 'tab tab-course tab-course-active' : 'tab tab-course'}
            aria-current={c.id === courseId ? 'true' : undefined}
            onClick={() => selectTab(activeByCourse[c.id])}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="tabs" role="group" aria-label="Quizzes và tài liệu">
        {course.tabs.map((t) => {
          const key = `${course.id}:${t.id}`
          return (
            <button
              key={key}
              type="button"
              className={key === activeKey ? 'tab tab-active' : 'tab'}
              aria-current={key === activeKey ? 'true' : undefined}
              onClick={() => selectTab(key)}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/*
        A tab loads on first visit and then stays mounted — across course
        switches too — so switching never discards the answers and score
        already entered in a quiz.

        Two invariants keep that true — breaking either silently wipes a user's
        progress, with no error and nothing in the console:

        1. `key={t.key}` must stay. Without it React reuses iframes positionally
           and rewrites `src`, reloading the document.
        2. Mounted tabs must keep a stable order matching ALL_TABS. Filtering a
           fixed list never moves an existing node relative to the others.
           Reordering (e.g. most-recent-first, or active-tab-first) reparents
           the iframe, and reparenting an iframe reloads it.

        Inactive frames are hidden with `visibility`, not `display: none`, which
        would destroy the layout box and reset the reader's scroll position.
      */}
      <div className="stage">
        {ALL_TABS.filter((t) => loaded.has(t.key)).map((t) => (
          <iframe
            key={t.key}
            className={t.key === activeKey ? 'frame' : 'frame frame-inactive'}
            src={`${import.meta.env.BASE_URL}${t.src}`}
            title={`${COURSES.find((c) => c.id === t.course).label} · ${t.label}`}
          />
        ))}
      </div>
    </div>
  )
}
