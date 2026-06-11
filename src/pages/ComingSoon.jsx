import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        padding: '20px',
        textAlign: 'center',
        fontFamily: "'Nunito', sans-serif",
      }}>
        <h1 style={{
          fontWeight: 900,
          fontSize: 'clamp(38px, 9vw, 68px)',
          color: 'rgba(255,255,255,0.90)',
          letterSpacing: '2px',
          lineHeight: 1.1,
          margin: 0,
        }}>
          Coming Soon
        </h1>
        <p style={{
          fontWeight: 700,
          fontSize: '16px',
          color: 'rgba(255,255,255,0.90)',
          opacity: 0.45,
          maxWidth: '260px',
          margin: 0,
        }}>
          We're working on something great. Check back soon.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '10px',
            padding: '13px 30px',
            borderRadius: '50px',
            border: 'none',
            background: 'linear-gradient(135deg, #FF8C3A 0%, #FF6B1A 100%)',
            color: 'rgba(255,255,255,0.90)',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(245, 197, 24, 0.38)',
          }}
        >
          Back to Home
        </button>
      </main>
    </>
  );
}
