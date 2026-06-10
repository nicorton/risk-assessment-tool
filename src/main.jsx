import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Target the unique WordPress-safe container ID
const rootElement = document.getElementById('finquery-close-risk-assessment-root')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} else {
  console.error("Could not find the 'finquery-close-risk-assessment-root' container element.")
}