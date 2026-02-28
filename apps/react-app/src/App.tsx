import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="mfe-container">
      <h1>React 19 Micro-Frontend</h1>
      <p className="subtitle">
        Loaded via single-spa &middot;{' '}
        <code>localStorage.app_version = &quot;react&quot;</code>
      </p>
      <div className="card">
        <p>Count: <strong>{count}</strong></p>
        <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      </div>
    </div>
  );
}

export default App;
