import { useEffect, useRef, useState } from 'react'
import './App.css'

const RRL_MAX_FILE_MB = 20
const RRL_STORAGE_KEY = 'citewise.workspaceId'

const ROUTES = [
  {
    path: '/',
    label: 'CATalyst Integration',
    Icon: IntegrationIcon,
    component: ModuleOnePage,
  },
  {
    path: '/rrl-upload',
    label: 'RRL Document Uploads',
    Icon: UploadIcon,
    component: RrlUploadPage,
  },
]

function formatFileSize(value) {
  if (!value || Number.isNaN(value)) {
    return ''
  }
  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

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
  const [groupId, setGroupId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const handleFileChange = (event) => {
    const incomingFiles = Array.from(event.target.files || [])
    setFiles((prev) => {
      const existingNames = new Set(prev.map(f => f.name))
      const newFiles = incomingFiles.filter(f => !existingNames.has(f.name))
      return [...prev, ...newFiles]
    })
    // Reset the input so the same file can be selected again if removed
    event.target.value = ''
  }

  const removeFile = (fileToRemove) => {
    setFiles((prev) => prev.filter(f => f !== fileToRemove))
  }

  const handleCatalystLoad = async () => {
    const trimmedGroupId = groupId.trim()
    setHasSynced(true)
    setLoadError('')
    setCatalystData(null)

    if (!trimmedGroupId) {
      setLoadError('Workspace ID is required.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/catalyst/${encodeURIComponent(trimmedGroupId)}`)
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        setLoadError(payload?.message || 'Unable to load CATalyst data.')
        return
      }

      setCatalystData(payload.data || null)
      localStorage.setItem(RRL_STORAGE_KEY, trimmedGroupId)
    } catch (error) {
      setLoadError('Unable to reach CATalyst right now.')
    } finally {
      setIsLoading(false)
    }
  }

  const clearFiles = () => {
    setFiles([])
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
              <input
                type="text"
                name="groupId"
                value={groupId}
                onChange={(event) => setGroupId(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn primary load-button"
              onClick={handleCatalystLoad}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load from CATalyst'}
            </button>
          </div>
          <div className="data-grid" aria-live="polite">
            {isLoading ? (
              <div className="empty-state span-12">Loading CATalyst data...</div>
            ) : loadError ? (
              <div className="empty-state error span-12">{loadError}</div>
            ) : catalystData ? (
              <>
                <div className="data-block span-12">
                  <p className="data-label">Research title</p>
                  <p className="data-value">{catalystData.title || 'N/A'}</p>
                </div>
                <div className="data-block span-12">
                  <p className="data-label">Rationale</p>
                  <p className="data-value">{catalystData.rationale || 'N/A'}</p>
                </div>
                <div className="data-block span-12">
                  <p className="data-label">Research gaps</p>
                  {Array.isArray(catalystData.gaps) && catalystData.gaps.length ? (
                    <ul className="data-list">
                      {catalystData.gaps.map((gap, index) => (
                        <li key={`${gap}-${index}`}>{gap}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="data-value">N/A</p>
                  )}
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
                  <li key={`${file.name}-${file.size}`} className="file-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size" style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      className="btn small ghost"
                      onClick={() => removeFile(file)}
                    >
                      Remove
                    </button>
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

function RrlUploadPage() {
  const fileInputRef = useRef(null)
  const [workspaceId, setWorkspaceId] = useState(
    () => localStorage.getItem(RRL_STORAGE_KEY) || '',
  )
  const [fileQueue, setFileQueue] = useState([])
  const [uploadState, setUploadState] = useState('ready')
  const [statusMessage, setStatusMessage] = useState('Ready to upload')
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (workspaceId) {
      localStorage.setItem(RRL_STORAGE_KEY, workspaceId)
    }
  }, [workspaceId])

  const buildFileKey = (file) =>
    `${file.name.toLowerCase()}-${file.size}-${file.lastModified}`

  const describeStatus = (status) => {
    switch (status) {
      case 'queued':
        return { label: 'Ready', tone: 'neutral' }
      case 'uploading':
        return { label: 'Uploading', tone: 'neutral' }
      case 'uploaded':
        return { label: 'Uploaded', tone: 'success' }
      case 'failed':
        return { label: 'Failed', tone: 'error' }
      case 'invalid':
        return { label: 'Rejected', tone: 'error' }
      case 'duplicate':
        return { label: 'Duplicate', tone: 'warn' }
      default:
        return { label: 'Queued', tone: 'neutral' }
    }
  }

  const appendFiles = (incomingFiles) => {
    if (!incomingFiles.length) {
      return
    }

    setUploadState('ready')
    setStatusMessage('Ready to upload')

    setFileQueue((prev) => {
      const next = [...prev]
      const seenKeys = new Set(prev.map((item) => item.key))

      Array.from(incomingFiles).forEach((file) => {
        const key = buildFileKey(file)
        const lowerName = file.name.toLowerCase()
        const isPdf =
          file.type === 'application/pdf' || lowerName.endsWith('.pdf')

        let status = 'queued'
        let message = 'Ready for upload'

        if (!isPdf) {
          status = 'invalid'
          message = 'Unsupported file type'
        } else if (file.size > RRL_MAX_FILE_MB * 1024 * 1024) {
          status = 'invalid'
          message = `File exceeds ${RRL_MAX_FILE_MB} MB limit`
        } else if (seenKeys.has(key)) {
          status = 'duplicate'
          message = 'Duplicate file ignored'
        }

        if (!seenKeys.has(key)) {
          seenKeys.add(key)
        }

        next.push({
          id: `${key}-${Math.random().toString(16).slice(2)}`,
          key,
          file,
          name: file.name,
          size: file.size,
          status,
          message,
        })
      })

      return next
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFileItem = (idToRemove) => {
    setFileQueue((prev) => prev.filter(item => item.id !== idToRemove))
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    appendFiles(event.dataTransfer?.files || [])
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleBrowse = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    const readyFiles = fileQueue.filter((item) => item.status === 'queued')

    if (!workspaceId.trim()) {
      setUploadState('error')
      setStatusMessage('Workspace session ID is required.')
      return
    }

    if (!readyFiles.length) {
      setUploadState('error')
      setStatusMessage('Add at least one valid PDF before uploading.')
      return
    }

    setUploadState('uploading')
    setStatusMessage('Uploading...')
    setFileQueue((prev) =>
      prev.map((item) =>
        item.status === 'queued'
          ? { ...item, status: 'uploading', message: 'Uploading...' }
          : item,
      ),
    )

    const formData = new FormData()
    readyFiles.forEach((item) => formData.append('files', item.file))

    try {
      const response = await fetch('/api/rrl/upload', {
        method: 'POST',
        headers: {
          'X-Session-Id': workspaceId.trim(),
        },
        body: formData,
      })

      let payload = null
      try {
        payload = await response.json()
      } catch (parseError) {
        payload = null
      }

      if (!response.ok) {
        setUploadState('error')
        setStatusMessage(payload?.message || 'Upload failed.')
        setFileQueue((prev) =>
          prev.map((item) =>
            item.status === 'uploading'
              ? { ...item, status: 'failed', message: 'Upload failed' }
              : item,
          ),
        )
        return
      }

      const results = payload?.data?.results || []
      const accepted = payload?.data?.acceptedFiles || 0
      const failed = payload?.data?.failedFiles || 0
      const hasFailures = failed > 0

      setUploadState(hasFailures ? 'warning' : 'success')
      setStatusMessage(
        hasFailures
          ? `Uploaded ${accepted} file(s), ${failed} need attention.`
          : `Uploaded ${accepted} file(s) successfully.`,
      )

      setFileQueue((prev) =>
        prev.map((item) => {
          const match = results.find((result) => result.fileName === item.name)
          if (!match) {
            return item.status === 'uploading'
              ? { ...item, status: 'failed', message: 'No response received' }
              : item
          }
          return {
            ...item,
            status: match.success ? 'uploaded' : 'failed',
            message: match.message,
          }
        }),
      )
    } catch (error) {
      setUploadState('error')
      setStatusMessage('Unable to reach the upload service.')
      setFileQueue((prev) =>
        prev.map((item) =>
          item.status === 'uploading'
            ? { ...item, status: 'failed', message: 'Network error' }
            : item,
        ),
      )
    }
  }

  const handleClear = () => {
    setFileQueue([])
    setUploadState('ready')
    setStatusMessage('Ready to upload')
  }

  const readyCount = fileQueue.filter((item) => item.status === 'queued').length
  const totalCount = fileQueue.length

  return (
    <div className="page">
      <section className="grid">
        <div className="card span-12 rrl-shell">
          <div className="rrl-header">
            <div>
              <h2>RRL document upload</h2>
              <p className="card-subtitle">
                Upload candidate Review of Related Literature PDFs for parsing.
              </p>
            </div>
            <label className="rrl-session">
              <span>Workspace session ID</span>
              <input
                type="text"
                value={workspaceId}
                onChange={(event) => setWorkspaceId(event.target.value)}
                placeholder="Paste session ID"
              />
            </label>
          </div>

          <div className="rrl-main">
            <div
              className={`rrl-dropzone${isDragging ? ' active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                onChange={(event) => {
                  appendFiles(event.target.files || [])
                }}
              />
              <div className="rrl-drop-content">
                <CloudIcon />
                <p>Drop PDF files here</p>
                <span>or</span>
                <button type="button" className="rrl-browse" onClick={handleBrowse}>
                  Browse
                </button>
                <small>Max {RRL_MAX_FILE_MB} MB per file</small>
              </div>
            </div>

            <div className="rrl-selected">
              <div className="rrl-selected-header">
                <p>Selected files</p>
                <span>{totalCount} in queue</span>
              </div>
              {fileQueue.length ? (
                <ul className="rrl-file-list">
                  {fileQueue.map((item) => {
                    const { label, tone } = describeStatus(item.status)
                    return (
                      <li key={item.id} className="rrl-file">
                        <div>
                          <p className="rrl-file-name">{item.name}</p>
                          <p className="rrl-file-meta">
                            {formatFileSize(item.size)} · {item.message}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`rrl-chip ${tone}`}>{label}</span>
                          {item.status !== 'uploading' && (
                            <button
                              type="button"
                              className="btn small ghost"
                              onClick={() => removeFileItem(item.id)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="rrl-empty">No files selected.</div>
              )}
            </div>
          </div>

          <div className="rrl-actions">
            <div className="rrl-buttons">
              <button
                type="button"
                className="btn primary"
                onClick={handleUpload}
                disabled={uploadState === 'uploading'}
              >
                {uploadState === 'uploading' ? 'Uploading...' : 'Upload All'}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={handleClear}
                disabled={!fileQueue.length || uploadState === 'uploading'}
              >
                Clear
              </button>
            </div>
            <div className="rrl-status">
              <div className="rrl-status-item">
                <span className="rrl-status-label">Files ready</span>
                <span className="rrl-status-value">{readyCount}</span>
              </div>
              <div className="rrl-status-item">
                <span className="rrl-status-label">Status</span>
                <span className={`rrl-status-value ${uploadState}`}>
                  {statusMessage}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
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

function UploadIcon() {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 16V5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 9l5-5 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 19h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg
      className="rrl-cloud"
      viewBox="0 0 48 32"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M14 26h21a9 9 0 0 0 0-18 11 11 0 0 0-21-2A8 8 0 0 0 14 26Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}


export default App
