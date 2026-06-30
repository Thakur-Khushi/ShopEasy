import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="startup-error">
          <h1>React failed to render</h1>
          <pre>{this.state.error.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  rootElement.innerHTML = `
    <div style="padding: 24px; font-family: system-ui, sans-serif; color: #8a1f11;">
      <h1>React failed to start</h1>
      <pre style="white-space: pre-wrap;">${error.message}</pre>
    </div>
  `;
  throw error;
}
