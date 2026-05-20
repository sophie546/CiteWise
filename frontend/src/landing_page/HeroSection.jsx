import React, { useState, useEffect } from 'react'

const HeroSection = ({ documents, onToggleApproval, onGenerateIntro, introText, onGetStarted, isLoading }) => {
  const [heroLoaded, setHeroLoaded] = useState(false)
  const [dashboardVisible, setDashboardVisible] = useState(false)
  const [howItWorksVisible, setHowItWorksVisible] = useState(false)
  const [sunOffset, setSunOffset] = useState(0)
  const [clickedButton, setClickedButton] = useState(null)
  
  // Typing animation states
  const [typedTexts, setTypedTexts] = useState({
    excerpt1: "",
    excerpt2: "",
    excerpt3: "",
  })
  
  // Counter animation states
  const [counters, setCounters] = useState({
    alignment: 0,
    methodological: 0,
    theoretical: 0,
    citation: 0,
  })

  const excerpts = {
    excerpt1: '"The framework proposed in this study addresses the critical gap in existing methodologies by introducing a novel approach..."',
    excerpt2: '"Results from the experimental validation indicate significant improvement over baseline approaches (p < 0.01)..."',
    excerpt3: '"Cross-validation across three independent datasets confirms the robustness and generalizability of findings..."',
  }

  const targetValues = {
    alignment: 92,
    methodological: 78,
    theoretical: 85,
    citation: 88,
  }

  const handleButtonClick = (buttonName) => {
    setClickedButton(buttonName)
    onGetStarted()
    setTimeout(() => setClickedButton(null), 800)
  }

  const getButtonStyle = (buttonName) => ({
    transition: "all 0.3s ease",
    ...(clickedButton === buttonName && {
      transform: "scale(0.98)",
      opacity: 0.7,
    })
  })

  // Typing effect for excerpts
  useEffect(() => {
    if (!dashboardVisible) return

    const typeText = (key, fullText, delay) => {
      setTimeout(() => {
        let index = 0
        const typeInterval = setInterval(() => {
          if (index < fullText.length) {
            setTypedTexts(prev => ({
              ...prev,
              [key]: fullText.substring(0, index + 1)
            }))
            index++
          } else {
            clearInterval(typeInterval)
          }
        }, 15)
        return () => clearInterval(typeInterval)
      }, delay)
    }

    typeText('excerpt1', excerpts.excerpt1, 400)
    typeText('excerpt2', excerpts.excerpt2, 1200)
    typeText('excerpt3', excerpts.excerpt3, 2000)
  }, [dashboardVisible])

  // Counter animation for percentage values
  useEffect(() => {
    if (!dashboardVisible) return

    const animateCounter = (key, targetValue, delay) => {
      setTimeout(() => {
        let current = 0
        const increment = targetValue / 40
        const counterInterval = setInterval(() => {
          if (current < targetValue) {
            current += increment
            setCounters(prev => ({
              ...prev,
              [key]: Math.min(Math.floor(current), targetValue)
            }))
          } else {
            setCounters(prev => ({ ...prev, [key]: targetValue }))
            clearInterval(counterInterval)
          }
        }, 30)
        return () => clearInterval(counterInterval)
      }, delay)
    }

    animateCounter('alignment', targetValues.alignment, 700)
    animateCounter('methodological', targetValues.methodological, 900)
    animateCounter('theoretical', targetValues.theoretical, 1100)
    animateCounter('citation', targetValues.citation, 1300)
  }, [dashboardVisible])

  useEffect(() => {
    setHeroLoaded(true)
    
    const handleScroll = () => {
      setSunOffset(window.scrollY * 0.3)
      
      const dashboardEl = document.getElementById('dashboard-card')
      if (dashboardEl) {
        const rect = dashboardEl.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.8) {
          setDashboardVisible(true)
        }
      }

      const howItWorksEl = document.getElementById('how-it-works')
      if (howItWorksEl) {
        const rect = howItWorksEl.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.8) {
          setHowItWorksVisible(true)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* ══════════════════════════════════════════
          HERO BLOCK  (nav + sun bg + headline)
      ══════════════════════════════════════════ */}
      <div style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* ── Sun full-bleed background with parallax ── */}
        <img
          src="/src/assets/sun.png"
          alt=""
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, calc(-50% + ${sunOffset}px))`,
            width: "100vw",
            height: "120vh",
            objectFit: "cover",
            zIndex: 0,
            transition: "transform 0.1s linear",
          }}
        />

        {/* ── Dark overlay so text is readable ── */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(30,28,25,0.55) 0%, rgba(30,28,25,0.1) 35%, rgba(30,28,25,0.6) 75%, #1E1C19 100%)",
          zIndex: 1,
          animation: heroLoaded ? "fadeIn 1s ease-out forwards" : "none",
        }} />

        {/* ── Navigation with fade-in ── */}
        <nav style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "22px 56px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(30,28,25,0.85)",
          backdropFilter: "blur(8px)",
          animation: heroLoaded ? "fadeInDown 0.6s ease-out forwards" : "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "#3A3630",
                border: "1px solid rgba(217, 138, 33, 0.2)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08) rotate(5deg)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1) rotate(0deg)")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="#D98A21"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="#D85A30"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="#D98A21"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />
              </svg>
            </div>
            <span style={{
              fontFamily: "'Poppins', sans-serif",
              color: "white",
              fontWeight: "700",
              fontSize: "1.25rem",
              letterSpacing: "0.01em",
              animation: heroLoaded ? "fadeInUp 0.7s ease-out 0.1s forwards" : "none",
              opacity: heroLoaded ? 1 : 0,
            }}>CiteWise</span>
          </div>

          <div style={{ display: "flex", gap: "40px", alignItems: "center" }}>
            {["Data Import", "AI Assessment", "Generate Introduction"].map((link, i) => (
              <span key={link} style={{
                fontFamily: "'Poppins', sans-serif",
                color: i === 0 ? "white" : "rgba(255,255,255,0.65)",
                fontSize: "0.9rem",
                fontWeight: i === 0 ? "600" : "400",
                cursor: "pointer",
                transition: "all 0.3s ease",
                animation: heroLoaded ? "fadeInDown 0.6s ease-out forwards" : "none",
                opacity: heroLoaded ? 1 : 0,
                animationDelay: `${0.1 + i * 0.1}s`,
              }}
              onClick={() => i === 0 && handleButtonClick('nav-data-import')}
              onMouseEnter={(e) => e.target.style.color = "white"}
              onMouseLeave={(e) => e.target.style.color = i === 0 ? "white" : "rgba(255,255,255,0.65)"}
              >{link}</span>
            ))}
          </div>

          <button 
            onClick={() => handleButtonClick('nav-get-started')}
            style={{
              ...getButtonStyle('nav-get-started'),
              fontFamily: "'Poppins', sans-serif",
              background: "white",
              border: "none",
              color: "#0a0a0a",
              padding: "10px 28px",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "all 0.3s ease",
              animation: heroLoaded ? "slideInRight 0.6s ease-out 0.3s forwards" : "none",
              opacity: heroLoaded ? 1 : 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              if (!clickedButton) {
                e.target.style.transform = "translateY(-2px)"
                 e.target.style.boxShadow = "0 12px 24px rgba(216,90,48,0.3)"
              }
            }}
            onMouseLeave={(e) => {
              if (!clickedButton) {
                e.target.style.transform = "translateY(0)"
                e.target.style.boxShadow = "none"
              }
            }}
            disabled={isLoading}
          >
            {clickedButton === 'nav-get-started' && (
              <div style={{
                width: "16px",
                height: "16px",
                border: "2px solid rgba(0,0,0,0.2)",
                borderTop: "2px solid #D85A30",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }} />
            )}
            Get Started
          </button>
        </nav>

        {/* ── Hero Text with staggered animations ── */}
        <div style={{
          position: "relative",
          zIndex: 5,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 48px 100px",
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid rgba(200,100,30,0.6)",
            borderRadius: "40px",
            padding: "6px 20px",
            fontSize: "0.8rem",
            color: "#e8723a",
            fontWeight: "200",
            fontFamily: "'Poppins', sans-serif",
            marginBottom: "28px",
            background: "rgba(180,60,0,0.15)",
            backdropFilter: "blur(4px)",
            animation: heroLoaded ? "fadeInUp 0.8s ease-out 0.2s forwards" : "none",
            opacity: heroLoaded ? 1 : 0,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          >
            <span style={{ fontSize: "0.55rem", color: "#e8723a" }}>●</span>
            AI-Powered Research Intelligence
          </div>

          <div style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "2rem",
            fontWeight: "150",
            color: "white",
            marginBottom: "6px",
            letterSpacing: "0.01em",
            animation: heroLoaded ? "fadeInUp 0.8s ease-out 0.3s forwards" : "none",
            opacity: heroLoaded ? 1 : 0,
          }}>
            Meet <span style={{ color: "#D98A21", fontWeight: "700", transition: "all 0.3s ease" }}>CiteWise</span>
          </div>

          <div style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "5rem",
            fontWeight: "600",
            color: "white",
            lineHeight: "1.0",
            marginBottom: "12px",
            letterSpacing: "-0.02em",
            animation: heroLoaded ? "fadeInUp 0.8s ease-out 0.4s forwards" : "none",
            opacity: heroLoaded ? 1 : 0,
          }}>
            your AI-powered
          </div>

          <div style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "2.2rem",
            fontWeight: "300",
            color: "rgba(255,255,255,0.9)",
            marginBottom: "40px",
            letterSpacing: "0.01em",
            animation: heroLoaded ? "fadeInUp 0.8s ease-out 0.5s forwards" : "none",
            opacity: heroLoaded ? 1 : 0,
          }}>
            research writing assistant
          </div>

          <button 
            onClick={() => handleButtonClick('learn-more')}
            style={{
              ...getButtonStyle('learn-more'),
              fontFamily: "'Poppins', sans-serif",
              background: "rgba(255,255,255,0.85)",
              border: "none",
              color: "#0a0a0a",
              padding: "7px 35px",
              borderRadius: "40px",
              fontSize: "0.95rem",
              fontWeight: "500",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
              letterSpacing: "0.01em",
              animation: heroLoaded ? "scaleIn 0.6s ease-out 0.6s forwards" : "none",
              opacity: heroLoaded ? 1 : 0,
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              if (!clickedButton) {
                e.target.style.transform = "translateY(-3px)"
                 e.target.style.boxShadow = "0 16px 32px rgba(216,90,48,0.4)"
              }
            }}
            onMouseLeave={(e) => {
              if (!clickedButton) {
                e.target.style.transform = "translateY(0)"
                e.target.style.boxShadow = "none"
              }
            }}
            disabled={isLoading}
          >
            {clickedButton === 'learn-more' && (
              <div style={{
                width: "14px",
                height: "14px",
                border: "2px solid rgba(0,0,0,0.2)",
                borderTop: "2px solid #D85A30",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }} />
            )}
            Learn more
          </button>
        </div>

        <div style={{
          position: "relative",
          zIndex: 5,
          textAlign: "center",
          padding: "0 48px 60px",
          fontFamily: "'Poppins', sans-serif",
          color: "rgba(255,255,255,0.6)",
          fontSize: "1rem",
          fontWeight: "400",
          lineHeight: "1.8",
          maxWidth: "840px",
          margin: "0 auto",
          animation: heroLoaded ? "fadeInUp 0.8s ease-out 0.7s forwards" : "none",
          opacity: heroLoaded ? 1 : 0,
        }}>
          Upload your RRL documents. CiteWise assesses relevance extracts evidence, and
          drafts your introduction with APA citations built in.
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DASHBOARD MOCKUP CARD (from image)
      ══════════════════════════════════════════ */}
      <div id="dashboard-card" style={{
        maxWidth: "880px",
        margin: "60px auto",
        padding: "0 24px",
        opacity: dashboardVisible ? 1 : 0.3,
        transform: dashboardVisible ? "translateY(0)" : "translateY(40px)",
        transition: "all 0.8s ease-out",
      }}>
        <div style={{
          background: "#1E1C19",
          border: "1px solid rgba(255,100,0,0.35)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(255,80,0,0.12), 0 24px 60px rgba(0,0,0,0.6)",
          fontFamily: "'Poppins', sans-serif",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 80px rgba(255,80,0,0.25), 0 32px 80px rgba(0,0,0,0.8)"
          e.currentTarget.style.transform = "translateY(-4px)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 0 60px rgba(255,80,0,0.12), 0 24px 60px rgba(0,0,0,0.6)"
          e.currentTarget.style.transform = "translateY(0)"
        }}
        >
          {/* Inner nav */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            animation: dashboardVisible ? "fadeInDown 0.6s ease-out forwards" : "none",
          }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: "700", fontSize: "0.9rem" }}>CiteWise</span>
            <div style={{ display: "flex", gap: "24px" }}>
              {["Data Import", "AI Assessment", "Generate Introduction"].map((t, i) => (
                <span key={t} style={{
                  fontSize: "0.75rem",
                  color: i === 1 ? "white" : "rgba(255,255,255,0.4)",
                  fontWeight: i === 1 ? "600" : "300",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onClick={() => i === 0 && handleButtonClick('dashboard-data-import')}
                onMouseEnter={(e) => e.target.style.color = "white"}
                onMouseLeave={(e) => e.target.style.color = i === 1 ? "white" : "rgba(255,255,255,0.4)"}
                >{t}</span>
              ))}
            </div>
            <div style={{ width: "80px" }} />
          </div>

          {/* Body */}
          <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 0 }}>
            {/* Left Panel */}
            <div style={{ padding: "16px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{
                background: "rgba(255,80,0,0.12)",
                border: "1px solid rgba(255,80,0,0.3)",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "0.68rem",
                color: "#ff8a42",
                fontWeight: "600",
                marginBottom: "14px",
                animation: dashboardVisible ? "slideInLeft 0.6s ease-out 0.1s forwards" : "none",
                opacity: dashboardVisible ? 1 : 0,
              }}>Document 1 of 3 <span style={{ float: "right" }}>🗑 ✎</span></div>

              <div style={{
                background: "rgba(255,80,0,0.15)",
                borderRadius: "6px",
                padding: "8px 10px",
                marginBottom: "14px",
                animation: dashboardVisible ? "fadeInUp 0.6s ease-out 0.2s forwards" : "none",
                opacity: dashboardVisible ? 1 : 0,
              }}>
                <div style={{ fontSize: "0.6rem", color: "#D98A21", fontWeight: "700", marginBottom: "5px" }}>APPROVAL STATUS</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "28px", height: "14px", background: "#D85A30", borderRadius: "7px", position: "relative" }}>
                    <div style={{ position: "absolute", right: "2px", top: "2px", width: "10px", height: "10px", background: "white", borderRadius: "50%", transition: "all 0.3s ease" }} />
                  </div>
                  <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.55)" }}>Approved</span>
                </div>
              </div>

              <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.35)", marginBottom: "8px", fontWeight: "600" }}>≡ Quick Navigation</div>
              {documents.map((doc, i) => (
                <div key={doc.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "5px 8px", borderRadius: "5px", marginBottom: "4px",
                  background: i === 0 ? "rgba(255,255,255,0.05)" : "transparent",
                  transition: "all 0.3s ease",
                  animation: dashboardVisible ? "slideInLeft 0.6s ease-out forwards" : "none",
                  opacity: dashboardVisible ? 1 : 0,
                  animationDelay: `${0.15 + i * 0.08}s`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.background = i === 0 ? "rgba(255,255,255,0.05)" : "transparent"}
                >
                  <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.55)" }}>{doc.name}</span>
                  <span style={{
                    width: "7px", height: "7px", borderRadius: "50%",
                    background: doc.approved ? "#D98A21" : "rgba(255,255,255,0.15)",
                    display: "inline-block",
                    transition: "all 0.3s ease",
                  }} />
                </div>
              ))}
            </div>

            {/* Right Panel */}
            <div style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", animation: dashboardVisible ? "fadeInUp 0.6s ease-out 0.2s forwards" : "none", opacity: dashboardVisible ? 1 : 0 }}>
                <span style={{ color: "white", fontWeight: "700", fontSize: "0.82rem" }}>🧠 AI Assessment Panel</span>
                <button style={{
                  background: "rgba(255,80,0,0.2)", border: "1px solid rgba(255,80,0,0.4)",
                  color: "#ff8a42", padding: "5px 12px", borderRadius: "6px",
                  fontSize: "0.68rem", cursor: "pointer", fontWeight: "600",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255,80,0,0.35)"
                  e.target.style.color = "#ffb380"
                  e.target.style.transform = "translateY(-2px)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255,80,0,0.2)"
                  e.target.style.color = "#ff8a42"
                  e.target.style.transform = "translateY(0)"
                }}
                >📤 Upload New PDF</button>
              </div>

              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "10px", padding: "12px", marginBottom: "14px",
                animation: dashboardVisible ? "scaleIn 0.6s ease-out 0.3s forwards" : "none",
                opacity: dashboardVisible ? 1 : 0,
              }}>
                <div style={{ fontSize: "0.68rem", color: "#ff8a42", fontWeight: "700", marginBottom: "10px" }}>🔍 Highlighted Evidence Excerpts</div>
                {[
                  { num: 1, key: "excerpt1", tag: "Page 3 • Relevance: High" },
                  { num: 2, key: "excerpt2", tag: "Page 7 • Relevance: High" },
                  { num: 3, key: "excerpt3", tag: "Page 9 • Relevance: Medium" },
                ].map((item, idx) => (
                  <div key={item.num} style={{
                    display: "grid", gridTemplateColumns: "20px 1fr", gap: "8px",
                    marginBottom: "10px", paddingBottom: "10px",
                    borderBottom: item.num < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    animation: dashboardVisible ? "fadeInUp 0.6s ease-out forwards" : "none",
                    opacity: dashboardVisible ? 1 : 0,
                    animationDelay: `${0.35 + idx * 0.08}s`,
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    minHeight: "50px",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    <span style={{
                      width: "17px", height: "17px", background: "rgba(255,100,0,0.3)",
                      borderRadius: "4px", fontSize: "0.58rem", color: "#ff8a42",
                      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700",
                      transition: "all 0.3s ease",
                      flexShrink: 0,
                    }}>{item.num}</span>
                    <div>
                      <div style={{ 
                        fontSize: "0.65rem", 
                        color: "rgba(255,255,255,0.72)", 
                        lineHeight: "1.4", 
                        marginBottom: "3px",
                        minHeight: "1.4em",
                        fontFamily: "'Courier New', monospace",
                      }}>
                        {typedTexts[item.key]}
                        {typedTexts[item.key] && typedTexts[item.key].length < excerpts[item.key].length && (
                          <span style={{
                            display: "inline-block",
                            width: "2px",
                            height: "0.65em",
                            background: "#D98A21",
                            marginLeft: "2px",
                            animation: "blink 1s infinite",
                          }} />
                        )}
                      </div>
                      <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.32)" }}>{item.tag}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: "0.68rem", color: "#ff8a42", fontWeight: "700", marginBottom: "10px", animation: dashboardVisible ? "fadeInUp 0.6s ease-out 0.4s forwards" : "none", opacity: dashboardVisible ? 1 : 0 }}>📊 Semantic Alignment Scores</div>
              {[
                { label: "Research Gap Alignment", key: "alignment", val: targetValues.alignment },
                { label: "Methodological Relevance", key: "methodological", val: targetValues.methodological },
                { label: "Theoretical Contribution", key: "theoretical", val: targetValues.theoretical },
                { label: "Citation Quality", key: "citation", val: targetValues.citation },
              ].map((item, idx) => (
                <div key={item.label} style={{
                  display: "grid", gridTemplateColumns: "1fr auto",
                  alignItems: "center", gap: "10px", marginBottom: "8px",
                  background: "rgba(255,255,255,0.03)", padding: "6px 10px", borderRadius: "6px",
                  animation: dashboardVisible ? "slideInRight 0.6s ease-out forwards" : "none",
                  opacity: dashboardVisible ? 1 : 0,
                  animationDelay: `${0.45 + idx * 0.08}s`,
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)"
                  e.currentTarget.style.transform = "translateX(4px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)"
                  e.currentTarget.style.transform = "translateX(0)"
                }}
                >
                  <div>
                    <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.65)", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ 
                        height: "100%", 
                        width: `${counters[item.key]}%`, 
                         background: "#D85A30", 
                        borderRadius: "3px", 
                        transition: "width 0.05s linear",
                         boxShadow: `0 0 8px rgba(216,90,48,0.6)`
                      }} />
                    </div>
                  </div>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: "700", color: "white",
                    background: "rgba(255,80,0,0.25)", padding: "2px 8px", borderRadius: "4px",
                    minWidth: "35px",
                    textAlign: "center",
                  }}>{counters[item.key]}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(30,28,25,0.8)",
            animation: dashboardVisible ? "fadeInUp 0.6s ease-out 0.6s forwards" : "none",
            opacity: dashboardVisible ? 1 : 0,
          }}>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>
              Approved Documents <span style={{ color: "white", fontWeight: "700" }}>1 / 3</span>
              &nbsp;&nbsp;Average Score <span style={{ color: "#D98A21", fontWeight: "700" }}>85.75%</span>
            </div>
             <button style={{
              background: "#D85A30", color: "white", border: "none",
              padding: "8px 20px", borderRadius: "8px",
              fontSize: "0.72rem", fontWeight: "700", cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onClick={onGenerateIntro}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)"
              e.target.style.background = "#e96439"
              e.target.style.boxShadow = "0 8px 20px rgba(216,90,48,0.4)"
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)"
              e.target.style.background = "#D85A30"
              e.target.style.boxShadow = "none"
            }}
            >→ Proceed to Synthesis</button>
          </div>
        </div>
      </div>

      {/* CSS for typing cursor animation */}
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <div id="how-it-works" style={{ maxWidth: "900px", margin: "0 auto 80px", padding: "0 48px", fontFamily: "'Poppins', sans-serif" }}>
        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", fontWeight: "600", letterSpacing: "0.14em", marginBottom: "36px", animation: howItWorksVisible ? "fadeInUp 0.6s ease-out forwards" : "none", opacity: howItWorksVisible ? 1 : 0 }}>HOW IT WORKS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {[
            { num: "01", icon: "file", title: "Import & Upload", desc: "Connect via CATalyst token or drag and drop your PDF documents. Batch upload your entire RRL in seconds" },
            { num: "02", icon: "download", title: "AI Assessment", desc: "Each document is scored for semantic alignment, evidence quality, and methodological relevance to your research gap" },
            { num: "03", icon: "pen", title: "Generate Introduction", desc: "Synthesize approved sources into a cohesive, citation ready introduction draft with proper APA formatting" },
          ].map((step, idx) => (
            <div key={step.num} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px", padding: "24px",
              animation: howItWorksVisible ? "fadeInUp 0.6s ease-out forwards" : "none",
              opacity: howItWorksVisible ? 1 : 0,
              animationDelay: `${idx * 0.15}s`,
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)"
              e.currentTarget.style.border = "1px solid rgba(255,100,0,0.4)"
              e.currentTarget.style.transform = "translateY(-6px)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)"
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"
              e.currentTarget.style.transform = "translateY(0)"
            }}
            >
              <div style={{ fontSize: "0.68rem", color: "#ff7a30", fontWeight: "700", marginBottom: "14px" }}>{step.num}</div>
              <img src={`/src/assets/${step.icon}.png`} alt={step.icon} style={{ width: "28px", height: "28px", marginBottom: "12px", objectFit: "contain", transition: "transform 0.3s ease" }} />
              <div style={{ color: "white", fontWeight: "700", fontSize: "0.9rem", marginBottom: "10px" }}>{step.title}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", lineHeight: "1.6", fontWeight: "300" }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default HeroSection