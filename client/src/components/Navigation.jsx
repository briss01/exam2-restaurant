import 'bootstrap-icons/font/bootstrap-icons.css';
import { Navbar, Nav, Container, Badge } from 'react-bootstrap';
import { LoginButton, LogoutButton } from './Auth';

/**
 * Navigation Component
 * 
 * Main navigation bar for the restaurant application.
 * Displays the restaurant branding, user information, and authentication controls.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object (if logged in)
 * @param {boolean} props.loggedIn - Whether user is authenticated
 * @param {boolean} props.loggedInTotp - Whether user has completed 2FA authentication
 * @param {Function} props.logout - Function to handle user logout
 */
const Navigation = (props) => {
  return (
    <Navbar
      className="shadow-lg"
      sticky="top"
      style={{
        backgroundColor: '#1e3a8a',
        borderBottom: '3px solid #3b82f6'
      }}
    >
      <Container fluid>
        {/* Left side: Brand icon and name */}
        <Navbar.Brand className="d-flex align-items-center fw-bold fs-3">
          <i className="bi bi-shop me-3" style={{ fontSize: '2.2rem', color: '#fbbf24', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}></i>
        </Navbar.Brand>
        
        {/* Center: Restaurant name */}
        <div className="position-absolute start-50 translate-middle-x">
          <span className="text-white fw-bold fs-3" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>Restaurant</span>
        </div>

        {/* Right side: User information and authentication controls */}
        <Nav className="ms-auto d-flex align-items-center">
          {/* Display user information when logged in */}
          {props.user && (
            <Nav.Item className="me-3">
              <div className="text-center">
                {/* Welcome message with user name */}
                <small style={{color: '#f0f0f0'}}>
                  Welcome, <span className="fw-bold" style={{color: '#fbbf24'}}>
                    {props.user.name}
                  </span>
                </small>
                {/* 2FA authentication status badge */}
                {props.loggedInTotp && (
                  <div>
                    <Badge 
                      className="ms-1 fw-bold" 
                      style={{
                        backgroundColor: '#0d9488',
                        boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
                        border: 'none'
                      }}
                    >
                      <i className="bi bi-shield-check me-1"></i>
                      2FA
                    </Badge>
                  </div>
                )}
              </div>
            </Nav.Item>
          )}
          
          {/* Authentication button (Login/Logout) */}
          <Nav.Item>
            {props.loggedIn ? (
              <LogoutButton logout={props.logout} />
            ) : (
              <LoginButton />
            )}
          </Nav.Item>
        </Nav>
      </Container>
    </Navbar>
  );
};

export { Navigation };
