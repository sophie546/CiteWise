import { useEffect, useRef, useState } from 'react'
import AIAssessmentPanel from './components/AIAssessmentPanel'
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
  {
    path: '/insights',
    label: 'AI Document Analysis',
    Icon: ChartIcon,
    component: InsightsPage,
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
          <CurrentPage navigate={navigate} />
        </main>
      </div>
    </div>
  )
}

function ModuleOnePage({ navigate }) {
  const [catalystData, setCatalystData] = useState(() => {
    const saved = localStorage.getItem('citewise.catalystData')
    if (!saved) {
      return null
    }
    try {
      return JSON.parse(saved)
    } catch (error) {
      return null
    }
  })
  const [hasSynced, setHasSynced] = useState(() => {
    return localStorage.getItem('citewise.hasSynced') === 'true'
  })
  const [groupId, setGroupId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const savedGroupId = localStorage.getItem(RRL_STORAGE_KEY)
    if (savedGroupId) {
      setGroupId(savedGroupId)
    }
  }, [])

  useEffect(() => {
    if (catalystData) {
      localStorage.setItem('citewise.catalystData', JSON.stringify(catalystData))
    } else {
      localStorage.removeItem('citewise.catalystData')
    }
  }, [catalystData])

  useEffect(() => {
    localStorage.setItem('citewise.hasSynced', hasSynced)
  }, [hasSynced])

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
        <section className="grid" style={{ marginTop: '2rem' }}>
          <div className="card span-12" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>Ready for RRL Analysis</h2>
            <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
              Your CATalyst topic baseline has been successfully loaded.
            </p>
            <button type="button" className="btn primary large" onClick={() => navigate('/rrl-upload')}>
              Next: Upload RRL Documents
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function RrlUploadPage({ navigate }) {
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

      setFileQueue((prev) => {
        const nextQueue = prev.map((item) => {
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
            documentId: match.documentId
          }
        })
        
        // Save successful ones to localStorage
        try {
            const successfulDocs = nextQueue.filter(item => item.status === 'uploaded' && item.documentId).map(item => ({ id: item.documentId, name: item.name }));
            if (successfulDocs.length > 0) {
                const existingStr = localStorage.getItem('citewise.uploadedDocs');
                const existing = existingStr ? JSON.parse(existingStr) : [];
                
                // Merge without duplicates
                const merged = [...existing];
                successfulDocs.forEach(doc => {
                    if (!merged.find(d => d.id === doc.id)) {
                        merged.push(doc);
                    }
                });
                localStorage.setItem('citewise.uploadedDocs', JSON.stringify(merged));
            }
        } catch (e) {
            console.error('Failed to save uploaded docs to local storage', e);
        }
        
        return nextQueue;
      })
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
                          {item.status === 'uploaded' && item.documentId && (
                            <button
                              type="button"
                              className="btn small primary"
                              onClick={() => {
                                localStorage.setItem('citewise.insightsDocId', item.documentId)
                                navigate('/insights')
                              }}
                            >
                              View Insights
                            </button>
                          )}
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

function ChartIcon() {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M18 20V10M12 20V4M6 20v-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function InsightsPage({ navigate }) {
  const [sessionId] = useState(() => localStorage.getItem(RRL_STORAGE_KEY) || '');
  const [documents, setDocuments] = useState([]);
  const [activeId, setActiveId] = useState(() => localStorage.getItem('citewise.insightsDocId') || null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const documentsRef = useRef([]);

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  // Fetch documents from backend on mount and poll for updates
  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;
    let pollTimer = null;

    const fetchDocs = async () => {
      try {
        if (isMounted && documentsRef.current.length === 0) setIsLoadingDocs(true);
        const res = await fetch(`/api/v1/documents/session/${encodeURIComponent(sessionId)}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          documentsRef.current = data;
          setDocuments(data);
          // Also sync localStorage for the upload page
          const docList = data.map(d => ({ id: d.id, name: d.fileName }));
          localStorage.setItem('citewise.uploadedDocs', JSON.stringify(docList));
        }
      } catch (e) {
        console.error('Failed to fetch session documents', e);
      } finally {
        if (isMounted) setIsLoadingDocs(false);
      }
      // Poll every 8 seconds if any doc is still processing
      if (isMounted) {
        pollTimer = setTimeout(fetchDocs, 8000);
      }
    };

    fetchDocs();
    return () => { isMounted = false; clearTimeout(pollTimer); };
  }, [sessionId]);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem('citewise.insightsDocId', activeId);
    }
  }, [activeId]);

  const handleDelete = async (docId, e) => {
    e.stopPropagation();
    try {
      await fetch(`/api/v1/documents/${docId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete from server', err);
    }
    setDocuments(prev => {
      const next = prev.filter(d => d.id !== docId);
      documentsRef.current = next;
      return next;
    });
    if (String(activeId) === String(docId)) {
      setActiveId(null);
      localStorage.removeItem('citewise.insightsDocId');
    }
  };

  return (
    <div className="insights-layout">
      {/* Sidebar: Uploaded RRLs */}
      <div className="insights-sidebar">
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Uploaded RRLs</h2>
              <p className="card-subtitle">Select a document to view insights</p>
            </div>
          </div>

          <div className="insights-doc-list">
            {isLoadingDocs && documents.length === 0 ? (
              <div className="empty-state">Loading documents...</div>
            ) : documents.length > 0 ? (
              documents.map(doc => {
                const isActive = String(activeId) === String(doc.id);
                const hasScores = doc.status === 'complete' && doc.relevancyScore != null;
                const pct = hasScores ? Math.round(doc.relevancyScore) : null;
                return (
                  <div
                    key={doc.id}
                    className={`insights-doc-item${isActive ? ' active' : ''}`}
                    onClick={() => setActiveId(String(doc.id))}
                  >
                    <div className="insights-doc-top">
                      <svg className="insights-doc-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="insights-doc-name">{doc.fileName}</span>
                      <button
                        type="button"
                        className="insights-doc-delete"
                        title="Remove document"
                        onClick={(e) => handleDelete(doc.id, e)}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    {hasScores ? (
                      <div className="insights-doc-score-row">
                        <div className="insights-doc-minibar-track">
                          <div className="insights-doc-minibar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="insights-doc-pct">{pct}%</span>
                      </div>
                    ) : (
                      <span className="insights-doc-status">
                        <span className="insights-doc-pulse" /> Analyzing...
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-state">No documents uploaded yet.</div>
            )}
          </div>

          <div className="insights-sidebar-footer">
            <button className="btn primary" style={{ width: '100%' }} onClick={() => navigate('/rrl-upload')}>
              Upload New PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main: AI Assessment Panel */}
      <div className="insights-main">
        {activeId ? (
          <AIAssessmentPanel documentId={activeId} onUploadClick={() => navigate('/rrl-upload')} />
        ) : (
          <div className="aap-empty">
            <svg className="aap-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Select a document from the left panel to view AI insights.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
