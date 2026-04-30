import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="modern-footer">
      <div className="modern-footer-container">
        
        {/* Main Grid Sections */}
        <div className="modern-footer-grid">
          
          {/* Brand Section */}
          <div className="modern-footer-brand">
            <Link to="/" className="modern-footer-logo">
              <div className="modern-footer-logo-icon">🎓</div>
              Smart Campus Hub
            </Link>
            <p className="modern-footer-desc">
              Streamlining campus operations with an integrated, intelligent platform for resources, bookings, and operations management.
            </p>
            <div className="modern-footer-social">
              <a href="#" aria-label="Twitter" className="modern-footer-social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
              <a href="#" aria-label="GitHub" className="modern-footer-social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.8c0-1.2-.4-2.2-1-3 2.7-.3 5.5-1.3 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.7 2.8 5.7 5.5 6-.6.6-1 1.5-1 2.8V21"></path></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="modern-footer-social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="modern-footer-section-title">Navigation</h4>
            <ul className="modern-footer-links">
              <li><Link to="/dashboard" className="modern-footer-link">Dashboard</Link></li>
              <li><Link to="/resources" className="modern-footer-link">Resources</Link></li>
              <li><Link to="/bookings" className="modern-footer-link">Bookings</Link></li>
              <li><Link to="/profile" className="modern-footer-link">Profile Settings</Link></li>
            </ul>
          </div>

          {/* Support / Help */}
          <div>
            <h4 className="modern-footer-section-title">Support</h4>
            <ul className="modern-footer-links">
              <li><a href="#" className="modern-footer-link">Help Center</a></li>
              <li><a href="#" className="modern-footer-link">Contact Us</a></li>
              <li><a href="#" className="modern-footer-link">System Status</a></li>
              <li><a href="#" className="modern-footer-link">FAQs</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="modern-footer-section-title">Legal</h4>
            <ul className="modern-footer-links">
              <li><a href="#" className="modern-footer-link">Privacy Policy</a></li>
              <li><a href="#" className="modern-footer-link">Terms of Service</a></li>
              <li><a href="#" className="modern-footer-link">Cookie Policy</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="modern-footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} Smart Campus Hub. All rights reserved.
          </div>
          <div className="modern-footer-bottom-links">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }}></span>
              All systems operational
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;