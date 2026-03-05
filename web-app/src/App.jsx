<<<<<<< Updated upstream
import { useEffect, useState } from 'react'
import './index.css'

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking systems...');
  const [isHealthy, setIsHealthy] = useState(false);

  useEffect(() => {
    // Ping the Express backend healthcheck endpoint we just created
    fetch('http://localhost:8000/api/v1/health')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBackendStatus('Backend Services Online');
          setIsHealthy(true);
        }
      })
      .catch(() => {
        setBackendStatus('Backend Offline (Check console)');
        setIsHealthy(false);
      });
  }, []);

  return (
    <>
      <div className="noise-overlay"></div>

      <main className="container">
        <section className="hero">
          <div className="status-badge">
            <span className="pulse" style={{ backgroundColor: isHealthy ? '#4ade80' : '#ef4444', boxShadow: isHealthy ? '0 0 10px #4ade80' : '0 0 10px #ef4444' }}></span>
            {backendStatus}
          </div>

          <h1>The New Standard<br /><i>in Commerce.</i></h1>
          <div className="accent-line"></div>
          <p>
            An uncompromising, robust backend architecture paired with an
            unapologetically aesthetic frontend experience. The B2B/B2C hybrid
            engine is ready.
          </p>

          <div>
            <button className="btn-luxury">Explore Catalog</button>
          </div>
        </section>

        <section className="product-grid">
          {/* Mockup of the strict Mongoose Models we built */}
          <div className="product-card">
            <div>
              <div className="product-sku">SKU-A92B-001</div>
              <h3 className="product-title">Industrial Counter</h3>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                Atomic increments guaranteeing sequence integrity across the entire platform.
              </p>
            </div>
            <div style={{ color: 'var(--accent)', marginTop: '2rem' }}>Strict Implementation Validation</div>
          </div>

          <div className="product-card">
            <div>
              <div className="product-sku">OTP-101 (TTL)</div>
              <h3 className="product-title">Dual-Path Wallet</h3>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                A pre-validate Mongoose hook ensuring perfect symmetrical audit logs between Admin credits and standard Payments.
              </p>
            </div>
            <div style={{ color: 'var(--accent)', marginTop: '2rem' }}>Schema Integrity Enforced</div>
          </div>
        </section>
      </main>
    </>
=======
import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import Signup from './components/Signup'
import ForgotPassword from './components/ForgotPassword'
import MyAccount from './components/MyAccount'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/my-account" element={<MyAccount />} />
    </Routes>
>>>>>>> Stashed changes
  )
}

export default App
