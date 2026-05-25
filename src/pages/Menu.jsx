import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';

export default function MenuPage() {
  return (
    <>
      <Navbar />
      <main className="hero">
        <h1 className="heading">
          <span className="h-dark">UNSER </span>
          <span className="h-red">MENU</span>
        </h1>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700,
          fontSize: '18px',
          color: '#1A0A00',
          opacity: 0.6,
          marginTop: '16px',
        }}>
          Kommt bald...
        </p>
        <div className="ctas" style={{ position: 'static', marginTop: '40px' }}>
          <Link to="/" className="btn">ZURÜCK</Link>
        </div>
      </main>
      <Socials />
    </>
  );
}
