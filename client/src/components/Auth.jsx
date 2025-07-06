import { useState } from 'react';
import { Form, Button, Alert, Col, Row, Card, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import API from '../API.js';

/**
 * TOTP (Two-Factor Authentication) Form Component
 * 
 * Handles the second step of authentication where users enter their 6-digit TOTP code
 * from their authenticator app to complete the login process.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.totpSuccessful - Callback function when TOTP verification succeeds
 * @param {Function} props.setTotpChoiceMade - Function to update TOTP choice state
 * @param {Function} props.setLoggedInTotp - Function to update 2FA login state
 */
function TotpForm(props) {
  // State for the TOTP code input field
  const [totpCode, setTotpCode] = useState('');
  // State for error messages display
  const [errorMessage, setErrorMessage] = useState('');
  // State to indicate if the form is currently submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Router navigation hook for programmatic navigation
  const navigate = useNavigate();

  /**
   * Verifies the TOTP code with the backend API
   * Handles success and error responses from the verification attempt
   */
  const doTotpVerify = () => {
    setIsSubmitting(true);
    API.totpVerify(totpCode)
      .then(() => {
        setErrorMessage('');
        props.totpSuccessful(); // Notify parent component of successful TOTP verification
        navigate('/orders'); // Redirect user to orders page after successful verification
      })
      .catch(() => {
        setErrorMessage('Wrong code, please try again');
        setIsSubmitting(false);
      })
  }

  /**
   * Handles form submission for TOTP verification
   * Validates the input and calls the verification function
   * 
   * @param {Event} event - Form submission event
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage('');

    // Basic validation: code must be exactly 6 digits
    let valid = true;
    if (totpCode === '' || totpCode.length !== 6)
      valid = false;

    if (valid) {
      doTotpVerify(totpCode);
    } else {
      setErrorMessage('Invalid content in form: either empty or not 6-char long');
    }
  };

  /**
   * Handles cancellation of TOTP verification
   * Resets state and redirects user back to orders page
   */
  const handleTotpCancel = () => {
    if (props.setTotpChoiceMade) props.setTotpChoiceMade(true);
    if (props.setLoggedInTotp) props.setLoggedInTotp(false);
    navigate('/orders');
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundColor: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        padding: '2rem 0'
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card 
              className="border-0"
              style={{
                borderRadius: '25px',
                boxShadow: '0 20px 40px rgba(30, 58, 138, 0.15)',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Card.Body className="p-5">
                {/* Header section with icon and title */}
                <div className="text-center mb-5">
                  <div 
                    className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#1e3a8a',
                      boxShadow: '0 8px 25px rgba(30, 58, 138, 0.3)'
                    }}
                  >
                    <i className="bi bi-shield-lock text-white" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <h2 
                    className="fw-bold mb-2"
                    style={{ 
                      color: '#1e3a8a',
                      fontFamily: 'serif'
                    }}
                  >
                    Two-Factor Authentication
                  </h2>
                  <p className="text-muted">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
                
                {/* TOTP verification form */}
                <Form onSubmit={handleSubmit}>
                  {/* Error message display */}
                  {errorMessage && (
                    <Alert 
                      variant='danger' 
                      dismissible 
                      onClick={() => setErrorMessage('')}
                      className="border-0 mb-4"
                      style={{
                        borderRadius: '15px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca'
                      }}
                    >
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {errorMessage}
                    </Alert>
                  )}
                  
                  {/* TOTP code input field */}
                  <Form.Group controlId='totpCode' className="mb-5">
                    <Form.Label 
                      className="fw-bold mb-3"
                      style={{ color: '#0d9488' }}
                    >
                      <i className="bi bi-key me-2"></i>
                      Verification Code
                    </Form.Label>
                    <Form.Control 
                      type='tel' 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={totpCode} 
                      onChange={ev => setTotpCode(ev.target.value)}
                      placeholder="000000"
                      className="text-center border-0"
                      style={{ 
                        fontSize: '2rem', 
                        letterSpacing: '0.8rem',
                        borderRadius: '15px',
                        background: '#f8fafc',
                        boxShadow: 'inset 0 4px 8px rgba(30, 58, 138, 0.1)',
                        padding: '1rem'
                      }}
                      maxLength="6"
                      autoComplete="off"
                    />
                    <Form.Text 
                      className="d-flex align-items-center justify-content-center mt-3"
                      style={{ color: '#0d9488' }}
                    >
                      <i className="bi bi-phone me-2"></i>
                      Check your authenticator app for the current code
                    </Form.Text>
                  </Form.Group>
                  
                  {/* Action buttons */}
                  <div className="d-grid gap-3">
                    <Button 
                      type='submit' 
                      size="lg" 
                      disabled={isSubmitting || totpCode.length !== 6}
                      className="fw-bold py-3 border-0"
                      style={{
                        borderRadius: '15px',
                        background: totpCode.length === 6 && !isSubmitting 
                          ? '#0d9488'
                          : '#9ca3af',
                        boxShadow: totpCode.length === 6 && !isSubmitting 
                          ? '0 8px 25px rgba(13, 148, 136, 0.3)'
                          : 'none',
                        color: 'white'
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2-circle me-2"></i>
                          Verify Code
                        </>
                      )}
                    </Button>
                    <Button 
                      variant='outline-secondary' 
                      size="lg"
                      className="fw-bold py-3 border-0"
                      onClick={handleTotpCancel}
                      disabled={isSubmitting}
                      style={{
                        borderRadius: '15px',
                        background: 'rgba(108, 117, 125, 0.1)',
                        color: '#6c757d'
                      }}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

/**
 * Login Form Component
 * 
 * Handles the initial login step where users enter their email and password.
 * This is the first step in the authentication process before TOTP verification.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.login - Function to handle login with credentials
 */
function LoginForm(props) {
  // State for username (email) input field
  const [username, setUsername] = useState('');
  // State for password input field
  const [password, setPassword] = useState('');
  // State for error messages display
  const [errorMessage, setErrorMessage] = useState('');

  // React Router navigation hook for programmatic navigation
  const navigate = useNavigate();

  /**
   * Handles login form submission
   * Validates input fields and calls the login function with credentials
   * 
   * @param {Event} event - Form submission event
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { username, password };

    // Simple validation for empty fields
    if (!username) {
      setErrorMessage('Username cannot be empty');
    } else if (!password) {
      setErrorMessage('Password cannot be empty');
    } else {
      // Call login function and handle any errors
      props.login(credentials) 
        .catch((err) => { 
          setErrorMessage(err.error); 
        });
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundColor: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        padding: '2rem 0'
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card 
              className="border-0"
              style={{
                borderRadius: '25px',
                boxShadow: '0 20px 40px rgba(30, 58, 138, 0.15)',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Card.Body className="p-5">
                {/* Header section with icon and title */}
                <div className="text-center mb-5">
                  <div 
                    className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#4f46e5',
                      boxShadow: '0 8px 25px rgba(79, 70, 229, 0.3)'
                    }}
                  >
                    <i className="bi bi-person-lock text-white" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <h2 
                    className="fw-bold mb-2"
                    style={{ 
                      color: '#4f46e5',
                      fontFamily: 'serif'
                    }}
                  >
                    Welcome Back
                  </h2>
                  <p className="text-muted">
                    Sign in to place your delicious order
                  </p>
                </div>

                {/* Login form */}
                <Form onSubmit={handleSubmit}>
                  {/* Error message display */}
                  {errorMessage && (
                    <Alert 
                      variant='danger' 
                      dismissible 
                      onClick={() => setErrorMessage('')}
                      className="border-0 mb-4"
                      style={{
                        borderRadius: '15px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca'
                      }}
                    >
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {errorMessage}
                    </Alert>
                  )}
                  
                  {/* Email input field */}
                  <Form.Group className="mb-4">
                    <Form.Label 
                      className="fw-bold mb-2"
                      style={{ color: '#1e3a8a' }}
                    >
                      <i className="bi bi-envelope me-2"></i>
                      Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={username}
                      placeholder="john.doe@polito.it"
                      onChange={(ev) => setUsername(ev.target.value)}
                      size="lg"
                      className="border-0"
                      style={{
                        borderRadius: '15px',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        boxShadow: 'inset 0 4px 8px rgba(30, 58, 138, 0.1)',
                        padding: '1rem 1.25rem'
                      }}
                    />
                  </Form.Group>
                  
                  {/* Password input field */}
                  <Form.Group className="mb-5">
                    <Form.Label 
                      className="fw-bold mb-2"
                      style={{ color: '#1e3a8a' }}
                    >
                      <i className="bi bi-lock me-2"></i>
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      placeholder="Enter your password"
                      onChange={(ev) => setPassword(ev.target.value)}
                      size="lg"
                      className="border-0"
                      style={{
                        borderRadius: '15px',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        boxShadow: 'inset 0 4px 8px rgba(30, 58, 138, 0.1)',
                        padding: '1rem 1.25rem'
                      }}
                    />
                  </Form.Group>
                  
                  {/* Action buttons */}
                  <div className="d-grid gap-3">
                    <Button 
                      type="submit" 
                      size="lg"
                      className="fw-bold py-3 border-0"
                      style={{
                        borderRadius: '15px',
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                        boxShadow: '0 8px 25px rgba(30, 58, 138, 0.3)',
                        color: 'white'
                      }}
                    >
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Sign In to Restaurant
                    </Button>
                    <Button 
                      variant="outline-secondary"
                      size="lg"
                      className="fw-bold py-3 border-0"
                      onClick={() => navigate('/')}
                      style={{
                        borderRadius: '15px',
                        background: 'rgba(108, 117, 125, 0.1)',
                        color: '#6c757d'
                      }}
                    >
                      <i className="bi bi-house me-2"></i>
                      Back to Home
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

/**
 * Login Button Component
 * 
 * Navigation button that appears in the header when user is not logged in.
 * Redirects to the login page when clicked.
 */
function LoginButton(props) {
  const navigate = useNavigate();
  return (
    <Button 
      variant="outline-light"
      className="fw-bold px-4 py-2"
      onClick={() => navigate('/login')}
      style={{
        borderWidth: '2px',
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255,255,255,0.4)',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'rgba(255,255,255,0.9)';
        e.target.style.color = '#1e3a8a';
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 6px 20px rgba(255,255,255,0.3)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'rgba(255,255,255,0.15)';
        e.target.style.color = 'white';
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
      }}
    >
      <i className="bi bi-box-arrow-in-right me-2"></i>
      Sign In
    </Button>
  )
}

/**
 * Logout Button Component
 * 
 * Button that appears in the header when user is logged in.
 * Calls the logout function when clicked to sign out the user.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.logout - Function to handle user logout
 */
function LogoutButton(props) {
  return (
    <Button 
      variant="outline-light"
      className="fw-bold px-4 py-2"
      onClick={props.logout}
      style={{
        borderWidth: '2px',
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255,255,255,0.4)',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'rgba(255,255,255,0.9)';
        e.target.style.color = '#1e3a8a';
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 6px 20px rgba(255,255,255,0.3)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'rgba(255,255,255,0.15)';
        e.target.style.color = 'white';
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
      }}
    >
      <i className="bi bi-box-arrow-right me-2"></i>
      Sign Out
    </Button>
  )
}

export { LoginForm, LogoutButton, LoginButton, TotpForm };
