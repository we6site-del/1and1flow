import React from 'react'

interface BackToDashboardButtonProps {
  onBack: () => void
}

export function BackToDashboardButton({ onBack }: BackToDashboardButtonProps) {
  return (
    <button
      className="back-to-dashboard-btn"
      onClick={onBack}
      title="返回首页"
      style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: 'white',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#333',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        pointerEvents: 'auto',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'white'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      返回首页
    </button>
  )
}
