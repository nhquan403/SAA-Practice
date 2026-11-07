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

const TAB_STATE_KEY = 'practice-app-tabs'

// Only the Claude course pages read this key; writing it from here reaches
// their already-open frames through the storage event.
const THEME_KEY = 'claude-dev-theme'
const THEMED_COURSE = 'claude'

function readSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

// Mobile browsers discard background tabs and reload them on return; restore
// the course and tab the reader was on. Unknown keys (e.g. a removed tab) fall
// back to the defaults.
function readSavedTabs() {
  const defaults = {
    courseId: COURSES[0].id,
    activeByCourse: Object.fromEntries(COURSES.map((c) => [c.id, `${c.id}:${c.tabs[0].id}`])),
  }
  try {
    const saved = JSON.parse(localStorage.getItem(TAB_STATE_KEY))
    const validKey = (key) => ALL_TABS.some((t) => t.key === key)
    if (!saved || !COURSES.some((c) => c.id === saved.courseId)) return defaults
    for (const c of COURSES) {
      const key = saved.activeByCourse?.[c.id]
      if (validKey(key) && key.startsWith(`${c.id}:`)) defaults.activeByCourse[c.id] = key
    }
    defaults.courseId = saved.courseId
  } catch {
    // Unreadable or blocked storage: start from the defaults.
  }
  return defaults
}

export default function App() {
  const [initial] = useState(readSavedTabs)
  const [courseId, setCourseId] = useState(initial.courseId)
  // Last tab opened in each course, so switching course and back returns to it.
  const [activeByCourse, setActiveByCourse] = useState(initial.activeByCourse)
  const [loaded, setLoaded] = useState(() => new Set([initial.activeByCourse[initial.courseId]]))

  const [theme, setTheme] = useState(readSavedTheme)

  const course = COURSES.find((c) => c.id === courseId)
  const activeKey = activeByCourse[courseId]
  const themed = courseId === THEMED_COURSE

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // Storage blocked: the open frames keep their current theme.
    }
  }

  useEffect(() => {
    document.title = course.title
  }, [course])

  // Match the tab bar's background (--bg-card) for each shell theme.
  const shellTheme = themed ? theme : 'dark'
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', shellTheme === 'light' ? '#ffffff' : '#12121a')
  }, [shellTheme])

  useEffect(() => {
    try {
      localStorage.setItem(TAB_STATE_KEY, JSON.stringify({ courseId, activeByCourse }))
    } catch {
      // Storage full or blocked: the tab just isn't remembered.
    }
  }, [courseId, activeByCourse])

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
    <div className="app" data-theme={shellTheme}>
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
        {themed && (
          <button
            type="button"
            className="tab tab-course tab-theme"
            aria-pressed={theme === 'light'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀️ Sáng' : '🌙 Tối'}
          </button>
        )}
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
