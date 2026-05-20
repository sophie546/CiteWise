import React, { useState, useEffect } from 'react'

const CTASection = ({ onGetStarted, isLoading }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [logoHover, setLogoHover] = useState(false)
  const [clickedButton, setClickedButton] = useState(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

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

  // Show loading overlay when isLoading is true
  if (isLoading) {
    return null // Loading is handled by LandingPage
  }

  return (
    <div style={{
      maxWidth: "900px",
      margin: "0 auto",
      padding: "60px 48px 80px",
      textAlign: "center",
      position: "relative",
    }}>
      <h2 style={{
        color: "white",
        fontSize: "2.2rem",
        fontWeight: "800",
        lineHeight: "1.3",
        margin: "0 0 12px",
        animation: isVisible ? "fadeInUp 0.8s ease-out forwards" : "none",
        opacity: isVisible ? 1 : 0,
      }}>
        Ready to write smarter research?<br />
        <span style={{ color: "#ff6a20", display: "inline-block" }}>Start today.</span>
      </h2>
      
      <p style={{ 
        color: "rgba(255,255,255,0.5)", 
        fontSize: "0.9rem", 
        margin: "0 0 32px",
        animation: isVisible ? "fadeInUp 0.8s ease-out 0.1s forwards" : "none",
        opacity: isVisible ? 1 : 0,
      }}>
        No credit card required, free for researchers
      </p>

      <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
        <button 
          onClick={() => handleButtonClick('cta-get-started')}
          style={{
            ...getButtonStyle('cta-get-started'),
            background: "#ff6a20",
            color: "white",
            border: "none",
            padding: "12px 32px",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "0.9rem",
            cursor: "pointer",
            animation: isVisible ? "scaleIn 0.6s ease-out 0.2s forwards" : "none",
            opacity: isVisible ? 1 : 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            if (!clickedButton) {
              e.target.style.transform = "translateY(-3px) scale(1.05)"
              e.target.style.boxShadow = "0 12px 32px rgba(255,106,32,0.4)"
            }
          }}
          onMouseLeave={(e) => {
            if (!clickedButton) {
              e.target.style.transform = "translateY(0) scale(1)"
              e.target.style.boxShadow = "none"
            }
          }}
          disabled={isLoading}
        >
          {clickedButton === 'cta-get-started' && (
            <div style={{
              width: "16px",
              height: "16px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTop: "2px solid white",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }} />
          )}
          Get Started
        </button>
        
        <button 
          onClick={() => handleButtonClick('cta-visit')}
          style={{
            ...getButtonStyle('cta-visit'),
            background: "transparent",
            color: "rgba(255,255,255,0.7)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            padding: "12px 32px",
            borderRadius: "10px",
            fontWeight: "600",
            fontSize: "0.9rem",
            cursor: "pointer",
            animation: isVisible ? "scaleIn 0.6s ease-out 0.3s forwards" : "none",
            opacity: isVisible ? 1 : 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            if (!clickedButton) {
              e.target.style.transform = "translateY(-3px)"
              e.target.style.borderColor = "rgba(255,255,255,0.4)"
              e.target.style.color = "white"
              e.target.style.background = "rgba(255,255,255,0.05)"
            }
          }}
          onMouseLeave={(e) => {
            if (!clickedButton) {
              e.target.style.transform = "translateY(0)"
              e.target.style.borderColor = "rgba(255,255,255,0.2)"
              e.target.style.color = "rgba(255,255,255,0.7)"
              e.target.style.background = "transparent"
            }
          }}
          disabled={isLoading}
        >
          {clickedButton === 'cta-visit' && (
            <div style={{
              width: "16px",
              height: "16px",
              border: "2px solid rgba(255,255,255,0.2)",
              borderTop: "2px solid white",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }} />
          )}
          Visit Catalyst
        </button>
      </div>

      <img
        src="/src/assets/logo.png"
        alt="logo"
        style={{
          position: "absolute",
          right: "0",
          top: "50%",
          transform: logoHover ? "translateY(-50%) scale(1.1) rotate(5deg)" : "translateY(-50%)",
          width: "80px",
          height: "80px",
          objectFit: "cover",
          opacity: logoHover ? 0.5 : 0.3,
          pointerEvents: "none",
          transition: "all 0.4s cubic-bezier(0.23, 1, 0.320, 1)",
          animation: isVisible ? "fadeIn 0.8s ease-out 0.4s forwards" : "none",
        }}
        onMouseEnter={() => setLogoHover(true)}
        onMouseLeave={() => setLogoHover(false)}
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default CTASection