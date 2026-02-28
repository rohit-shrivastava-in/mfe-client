import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#61dafb' }}>React 19 Micro-Frontend</h1>
      <p style={{ marginBottom: '1rem', color: '#888' }}>
        Loaded via single-spa ·{' '}
        <code>localStorage.app_version = &quot;react&quot;</code>
      </p>
      <div style={{ display: 'inline-block', padding: '1rem 2rem', background: '#1a1a2e', borderRadius: 8 }}>
        <p>Count: <strong>{count}</strong></p>
        <button
          onClick={() => setCount((c) => c + 1)}
          style={{
            marginTop: '0.5rem',
            padding: '0.4rem 1.2rem',
            background: '#61dafb',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Increment
        </button>
      </div>
    </div>
  );
}

export default App;
