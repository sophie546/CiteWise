import { useEffect, useState } from 'react'
import './App.css'

const ROUTES = [
  {
    path: '/',
    label: 'CATalyst Integration',
    Icon: IntegrationIcon,
    component: ModuleOnePage,
  },
]

function normalizePath(value) {
  if (!value || value === '/') {
    return '/'
  }
  return value.replace(/\/+$/, '')
}

function usePathname() {
  const [path, setPath] = useState(() =>
    normalizePath(window.location.pathname),
  )

  useEffect(() => {
    const handlePop = () => {
      setPath(normalizePath(window.location.pathname))
    }

    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  return [path, setPath]
}

function App() {
  const [path, setPath] = usePathname()
  const currentPath = normalizePath(path)
  const currentRoute =
    ROUTES.find((route) => route.path === currentPath) || ROUTES[0]
  const CurrentPage = currentRoute.component

  const navigate = (nextPath) => {
    const target = normalizePath(nextPath)
    if (target === currentPath) {
      return
    }
    window.history.pushState({}, '', target)
    setPath(target)
  }

  const handleNav = (event, nextPath) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.button !== 0
    ) {
      return
    }
    event.preventDefault()
    navigate(nextPath)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">CW</div>
          <div className="brand-text">
            <span className="brand-name">CiteWise</span>
          </div>
        </div>
        <div className="topbar-actions">
          <label className="search">
            <SearchIcon />
            <input
              type="search"
              aria-label="Search workspace"
            />
          </label>
          <button type="button" className="btn ghost">
            Invite
          </button>
          <button type="button" className="btn primary">
            New project
          </button>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar">
          <div className="sidebar-group">
            <p className="sidebar-label">Workspace</p>
            <nav className="nav">
              {ROUTES.map((route) => {
                const Icon = route.Icon
                const isActive = route.path === currentRoute.path
                return (
                  <a
                    key={route.path}
                    href={route.path}
                    className={`nav-link${isActive ? ' active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(event) => handleNav(event, route.path)}
                  >
                    <Icon />
                    <span>{route.label}</span>
                  </a>
                )
              })}
            </nav>
          </div>
        </aside>

        <main className="content">
          <div className="content-header">
            <div>
              <h1>{currentRoute.label}</h1>
            </div>
            <div className="header-actions">
              <button type="button" className="btn ghost">
                Share
              </button>
              <button type="button" className="btn secondary">
                Generate brief
              </button>
            </div>
          </div>
          <CurrentPage />
        </main>
      </div>
    </div>
  )
}

function ModuleOnePage() {
  const [files, setFiles] = useState([])
  const [catalystData, setCatalystData] = useState(null)
  const [hasSynced, setHasSynced] = useState(false)

  const handleFileChange = (event) => {
    const nextFiles = Array.from(event.target.files || [])
    setFiles(nextFiles)
  }

  const handleCatalystLoad = () => {
    setCatalystData(null)
    setHasSynced(true)
  }

  const clearFiles = () => {
    setFiles([])
  }

  const formatFileSize = (value) => {
    if (!value || Number.isNaN(value)) {
      return ''
    }
    if (value < 1024 * 1024) {
      return `${Math.round(value / 1024)} KB`
    }
    return `${(value / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="page">
      <section className="grid">
        <div className="card span-7">
          <div className="card-header">
            <div>
              <h2>CATalyst input</h2>
              <p className="card-subtitle">
                Load the research title, rationale, and gaps from CATalyst.
              </p>
            </div>
          </div>
          <div className="field-grid two-col">
            <label className="field">
              <span>Workspace ID</span>
              <input type="text" name="groupId" />
            </label>
            <button
              type="button"
              className="btn primary load-button"
              onClick={handleCatalystLoad}
            >
              Load from CATalyst
            </button>
          </div>
          <div className="data-grid" aria-live="polite">
            {catalystData ? (
              <>
                <div className="data-block span-12">
                  <p className="data-label">Research title</p>
                  <p className="data-value">{catalystData.title}</p>
                </div>
                <div className="data-block span-12">
                  <p className="data-label">Rationale</p>
                  <p className="data-value">{catalystData.rationale}</p>
                </div>
                <div className="data-block span-12">
                  <p className="data-label">Research gaps</p>
                  <ul className="data-list">
                    {catalystData.gaps.map((gap, index) => (
                      <li key={`${gap}-${index}`}>{gap}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : hasSynced ? (
              <div className="empty-state span-12">
                No CATalyst data loaded.
              </div>
            ) : null}
          </div>
        </div>
        {hasSynced ? (
          <div className="stack span-5">
            <div className="card">
              <div className="card-header">
                <h2>Standardization map</h2>
                <button type="button" className="btn small ghost">
                  Run mapping
                </button>
              </div>
              <div className="table-wrap">
                <table className="table table-compact">
                  <thead>
                    <tr>
                      <th>CATalyst field</th>
                      <th>Mapped to</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="3">
                        <div className="empty-state">
                          No fields mapped yet.
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Validation rubric</h2>
              </div>
              <div className="empty-state">
                Validation results will appear after mapping.
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {hasSynced ? (
        <section className="grid">
          <div className="card span-12">
            <div className="card-header">
              <div>
                <h2>Batch PDF upload</h2>
                <p className="card-subtitle">
                  Upload candidate RRL documents for parsing.
                </p>
              </div>
              <div className="upload-actions">
                <button type="button" className="btn small" disabled={!files.length}>
                  Parse selected
                </button>
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={clearFiles}
                  disabled={!files.length}
                >
                  Clear
                </button>
              </div>
            </div>

            <label className="upload-box">
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleFileChange}
              />
              <div>
                <p className="upload-title">Drop PDF files or browse</p>
                <p className="upload-meta">Multiple files supported</p>
              </div>
            </label>

            {files.length ? (
              <ul className="file-list">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="file-item">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">No files selected.</div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}


function SearchIcon() {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20l-3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IntegrationIcon() {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 12l4-4 4 4 4-4 4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 20h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}


export default App
