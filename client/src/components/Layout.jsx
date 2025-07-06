import { Row, Col, Button, Alert, Card, Container } from 'react-bootstrap';
import { Outlet, Link, useNavigate } from 'react-router';
import { Navigation } from './Navigation';
import { LoginForm, TotpForm } from './Auth';
import { OrderConfigurator } from './OrderConfigurator';
import { OrderHistory } from './OrderHistory';

/**
 * 404 Not Found Page Layout
 * 
 * Displays a user-friendly error page when a route is not found.
 * Provides navigation back to the home page.
 */
function NotFoundLayout(props) {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #f1f5f9 60%, #dbeafe 100%)' }}>
      <div className="text-center p-5 rounded-4 shadow-lg" style={{ background: '#fff', maxWidth: 420 }}>
        <i className="bi bi-emoji-frown" style={{ fontSize: '4rem', color: '#1e3a8a', marginBottom: '1rem' }}></i>
        <h2 className="fw-bold mb-3" style={{ color: '#1e3a8a', fontFamily: 'serif', letterSpacing: '1px' }}>404 - Page Not Found</h2>
        <p className="text-muted mb-4" style={{ fontSize: '1.15rem' }}>Sorry, the page you are looking for does not exist or has been moved.</p>
        <Link to="/">
          <Button variant="primary" size="lg" className="px-4 py-2 fw-bold" style={{ borderRadius: '12px', background: '#1e3a8a', border: 'none' }}>
            <i className="bi bi-house-door me-2"></i>
            Go back to the Home Page
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Login Page Layout Wrapper
 * 
 * Wraps the LoginForm component in a layout structure.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.login - Function to handle user login
 */
function LoginLayout(props) {
  return (
    <Row>
      <Col>
        <LoginForm login={props.login} />
      </Col>
    </Row>
  );
}

/**
 * TOTP (Two-Factor Authentication) Page Layout Wrapper
 * 
 * Wraps the TotpForm component in a layout structure.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.totpSuccessful - Callback when TOTP verification succeeds
 */
function TotpLayout(props) {
  return (
    <Row>
      <Col>
        <TotpForm totpSuccessful={props.totpSuccessful} />
      </Col>
    </Row>
  );
}

/**
 * Order Configuration Page Layout
 * 
 * Wraps the OrderConfigurator component and handles error message display.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.ingredients - Available ingredients for orders
 * @param {Array} props.dishes - Available base dishes
 * @param {Array} props.sizes - Available dish sizes
 * @param {Array} props.orderList - Current list of orders
 * @param {Function} props.setOrderList - Function to update order list
 * @param {Function} props.handleErrors - Error handling function
 * @param {boolean} props.dirty - Flag indicating data needs refresh
 * @param {Function} props.setDirty - Function to update dirty flag
 * @param {string} props.message - Error message to display
 * @param {Function} props.setMessage - Function to update message
 */
function OrderLayout(props) {
  const { ingredients = [], dishes = [], sizes = [] } = props;
  
  return (
    <>
      {/* Error message display */}
      {props.message ? <Alert className='my-1' onClose={() => props.setMessage('')} variant='danger' dismissible>{props.message}</Alert> : null}
      <OrderConfigurator 
        ingredients={ingredients} 
        dishes={dishes}
        sizes={sizes}
        orderList={props.orderList} 
        setOrderList={props.setOrderList} 
        handleErrors={props.handleErrors} 
        dirty={props.dirty} 
        setDirty={props.setDirty} 
      />
    </>
  );
}

/**
 * Order History Page Layout
 * 
 * Wraps the OrderHistory component in a layout structure.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.orderList - List of orders to display
 * @param {boolean} props.loggedInTotp - Whether user has completed 2FA
 * @param {Function} props.handleErrors - Error handling function
 * @param {Function} props.setDirty - Function to trigger data refresh
 * @param {boolean} props.loading - Loading state indicator
 */
function OrderHistoryLayout(props) {
  return (
    <>
      <Row>
        <Col>
          <OrderHistory 
            orderList={props.orderList} 
            loggedInTotp={props.loggedInTotp}
            handleErrors={props.handleErrors}
            setDirty={props.setDirty}
            loading={props.loading}
          />
        </Col>
      </Row>
    </>
  );
}

/**
 * Menu and Ingredients Display Layout (Home Page)
 * 
 * Displays the restaurant menu and available ingredients in a two-column layout.
 * Shows base dishes on the left and ingredients on the right.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.ingredients - Available ingredients with availability info
 * @param {Array} props.dishes - Available base dishes with descriptions
 * @param {Array} props.sizes - Available dish sizes with pricing
 * @param {boolean} props.loading - Loading state indicator
 */
function MenuLayout(props) {
  const { ingredients = [], dishes = [], sizes = [], loading = false } = props;
  
  return (
    <div style={{backgroundColor: '#f1f5f9', minHeight: '100vh'}}>
      <div className="container-fluid py-4">
        {/* Welcome message header */}
        <div className="row mb-4">
          <div className="col-12 text-center">
            <h1 className="fw-bold" style={{color: '#1e3a8a', fontSize: '2.5rem'}}>
              <i className="bi bi-star-fill me-3" style={{color: '#fbbf24'}}></i>
              Welcome to our restaurant!
            </h1>
          </div>
        </div>
        
        <div className="row g-4">
          {/* Base Dishes Section - Left Column */}
          <div className="col-lg-6">
            <div className="card border-0 h-100" style={{backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)'}}>
              <div className="card-header border-0 text-center py-4" style={{backgroundColor: '#1e3a8a', borderRadius: '20px 20px 0 0'}}>
                <h2 className="mb-0 fw-bold text-white" style={{fontFamily: 'serif', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <span style={{display: 'inline-flex', alignItems: 'center'}}>
                    <i className="bi bi-list" style={{color: '#fff', fontSize: '2.2rem', marginRight: '0.7rem', verticalAlign: 'middle'}}></i>
                    Our Menu
                  </span>
                </h2>
              </div>
              <div className="card-body p-4">
                {/* Loading state for dishes */}
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border" style={{color: '#3b82f6', width: '3rem', height: '3rem'}}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted fs-5">Preparing our menu...</p>
                  </div>
                ) : (
                  /* Dishes list with interactive hover effects */
                  <div className="d-grid gap-3">
                    {dishes.map(dish => (
                      <div key={dish.id}>
                        <div className="p-4 border-0 h-100" style={{
                          backgroundColor: '#e0f2fe', 
                          borderRadius: '15px',
                          borderLeft: '5px solid #3b82f6',
                          transition: 'all 0.3s ease',
                          cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#bae6fd';
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#e0f2fe';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}>
                          <div className="d-flex align-items-center">
                            <div className="me-4">
                              <div className="d-flex align-items-center justify-content-center"
                                   style={{
                                     width: '80px', 
                                     height: '80px',
                                     background: '#1e3a8a', 
                                     borderRadius: '50%',
                                     boxShadow: '0 4px 15px rgba(30, 58, 138, 0.3)'
                                   }}>
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <h4 className="fw-bold mb-2" style={{color: '#1e3a8a', fontFamily: 'serif'}}>{dish.name}</h4>
                              {/* Size options with pricing */}
                              <div className="d-flex flex-column align-items-start gap-1">
                                {sizes && sizes.length > 0 && sizes.map(size => (
                                  <span key={size.id} className="badge px-3 py-2 fs-6 fw-bold text-white" 
                                        style={{
                                          backgroundColor: '#4f46e5', 
                                          borderRadius: '15px',
                                          marginRight: '8px',
                                          marginBottom: '2px'
                                        }}>
                                    {size.name}: €{size.price.toFixed(2)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ingredients Section - Right Column */}
          <div className="col-lg-6">
            <div className="card border-0 h-100" style={{backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)'}}>
              <div className="card-header border-0 text-center py-4" style={{backgroundColor: '#0d9488', borderRadius: '20px 20px 0 0'}}>
                <h2 className="mb-0 fw-bold text-white" style={{fontFamily: 'serif', letterSpacing: '1px'}}>
                  <i className="bi bi-basket3-fill me-3"></i>
                  Fresh Ingredients
                </h2>
              </div>
              <div className="card-body p-4" style={{maxHeight: '75vh', overflowY: 'auto'}}>
                {/* Loading state for ingredients */}
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border" style={{color: '#14b8a6', width: '3rem', height: '3rem'}}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted fs-5">Gathering fresh ingredients...</p>
                  </div>
                ) : (
                  /* Ingredients list with availability status and pricing */
                  <div className="d-grid gap-3">
                    {ingredients.map(ing => {
                      // Determine ingredient availability status
                      const isAvailable = ing.availability === null || ing.availability > 0;
                      const isLowStock = ing.availability !== null && ing.availability <= 5 && ing.availability > 0;
                      
                      return (
                        <div key={ing.id}>
                          <div className="p-3 border-0 h-100" 
                               style={{
                                 backgroundColor: isAvailable ? '#ecfdf5' : '#f8fafc',
                                 borderRadius: '12px',
                                 borderLeft: `4px solid ${isAvailable ? '#14b8a6' : '#9e9e9e'}`,
                                 opacity: isAvailable ? 1 : 0.7,
                                 transition: 'all 0.3s ease'
                               }}
                               onMouseEnter={(e) => {
                                 if (isAvailable) {
                                   e.target.style.backgroundColor = '#d1fae5';
                                   e.target.style.transform = 'translateX(3px)';
                                 }
                               }}
                               onMouseLeave={(e) => {
                                 if (isAvailable) {
                                   e.target.style.backgroundColor = '#ecfdf5';
                                   e.target.style.transform = 'translateX(0)';
                                 }
                               }}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1 me-3">
                                {/* Ingredient name and status icon */}
                                <div className="d-flex align-items-center mb-2">
                                  <div className="rounded-circle me-3 d-flex align-items-center justify-content-center" 
                                       style={{
                                         width: '40px', 
                                         height: '40px', 
                                         background: isAvailable 
                                           ? '#0d9488' 
                                           : '#9e9e9e'
                                       }}>
                                    <i className="bi bi-check2-circle text-white"></i>
                                  </div>
                                  <div>
                                    <h6 className="mb-0 fw-bold" style={{color: '#0d9488', fontSize: '1.1rem'}}>{ing.name}</h6>
                                    <small className="text-muted">Fresh • Locally sourced</small>
                                  </div>
                                </div>
                                
                                {/* Dependencies information */}
                                {(ing.dependencies && ing.dependencies.length > 0) && (
                                  <div className="mb-2 p-2" style={{backgroundColor: '#dbeafe', borderRadius: '8px'}}>
                                    <small className="fw-semibold" style={{color: '#1e3a8a'}}>
                                      <i className="bi bi-link-45deg me-1"></i>
                                      Best paired with: {ing.dependencies.join(', ')}
                                    </small>
                                  </div>
                                )}
                                
                                {/* Incompatibilities information */}
                                {(ing.incompatibilities && ing.incompatibilities.length > 0) && (
                                  <div className="mb-2 p-2" style={{backgroundColor: '#fef3c7', borderRadius: '8px'}}>
                                    <small className="fw-semibold" style={{color: '#92400e'}}>
                                      <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                      Not recommended with: {ing.incompatibilities.join(', ')}
                                    </small>
                                  </div>
                                )}
                              </div>
                              
                              {/* Price and availability information */}
                              <div className="text-end">
                                <div className="mb-2">
                                  <span className="badge px-3 py-2 fw-bold fs-6 text-white" 
                                        style={{
                                          backgroundColor: '#4f46e5', 
                                          borderRadius: '20px'
                                        }}>
                                    €{ing.price?.toFixed(2)}
                                  </span>
                                </div>
                                
                                <div>
                                  {/* Availability status badge */}
                                  {ing.availability !== null ? (
                                    <span className="badge px-3 py-1 fw-bold" 
                                          style={{
                                            background: ing.availability > 5 
                                              ? '#0d9488' 
                                              : ing.availability > 0
                                              ? '#f59e0b'
                                              : '#dc2626',
                                            color: 'white',
                                            borderRadius: '15px'
                                          }}>
                                      {ing.availability > 0 ? (
                                        <>
                                          {isLowStock && <i className="bi bi-exclamation-circle me-1"></i>}
                                          {ing.availability} left
                                        </>
                                      ) : (
                                        <>
                                          <i className="bi bi-x-circle me-1"></i>
                                          Out of stock
                                        </>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="badge px-3 py-1 fw-bold text-white" 
                                          style={{backgroundColor: '#0d9488', borderRadius: '15px'}}>
                                      <i className="bi bi-infinity me-1"></i>
                                      Always fresh
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generic Layout with Navigation and Outlet
 * 
 * Main layout wrapper that includes navigation bar and handles nested routes.
 * Displays error messages and renders child routes using React Router's Outlet.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.loggedIn - Whether user is authenticated
 * @param {Object} props.user - Current user object
 * @param {boolean} props.loggedInTotp - Whether user has completed 2FA
 * @param {Function} props.logout - Function to handle user logout
 * @param {string} props.message - Error message to display
 * @param {Function} props.setMessage - Function to update message
 */
function GenericLayout(props) {

  return (
    <>
      <Navigation loggedIn={props.loggedIn} user={props.user} loggedInTotp={props.loggedInTotp} logout={props.logout} />
      <Row><Col>{props.message ? <Alert className='my-1' onClose={() => props.setMessage('')} variant='danger' dismissible>{props.message}</Alert> : null}</Col></Row>
      <Outlet />
    </>
  );
}

/**
 * Order Page Layout (Menu + Order Form Side by Side)
 * 
 * Creates a two-column layout with menu on the left and order configuration on the right.
 * Used for the main ordering interface.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.ingredients - Available ingredients
 * @param {Array} props.dishes - Available base dishes
 * @param {Array} props.sizes - Available dish sizes
 * @param {Array} props.orderList - Current list of orders
 * @param {Function} props.setOrderList - Function to update order list
 * @param {Function} props.handleErrors - Error handling function
 * @param {boolean} props.dirty - Flag indicating data needs refresh
 * @param {Function} props.setDirty - Function to update dirty flag
 * @param {boolean} props.loading - Loading state indicator
 */
function OrderPageLayout(props) {
  return (
    <Row>
      {/* Left column: Menu display */}
      <Col xs={6}>
        <MenuLayout 
          ingredients={props.ingredients}
          dishes={props.dishes}
          sizes={props.sizes}
          loading={props.loading}
        />
      </Col>
      {/* Right column: Order configuration */}
      <Col xs={6}>
        <OrderLayout 
          ingredients={props.ingredients}
          dishes={props.dishes}
          sizes={props.sizes}
          orderList={props.orderList}
          setOrderList={props.setOrderList}
          handleErrors={props.handleErrors}
          dirty={props.dirty}
          setDirty={props.setDirty}
        />
      </Col>
    </Row>
  );
}

/**
 * TOTP Choice Layout
 * 
 * Allows users to choose whether to enable Two-Factor Authentication (2FA).
 * Provides options to enable 2FA or skip it for now.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.setTotpChoiceMade - Function to update TOTP choice state
 * @param {Function} props.setLoggedInTotp - Function to update 2FA login state
 */
function ChooseTotpLayout(props) {
  const navigate = useNavigate();

  /**
   * Handler for enabling TOTP authentication
   * Navigates to the TOTP setup page
   */
  const handleUseTotp = () => {
    navigate('/totp');
  };

  /**
   * Handler for skipping TOTP authentication
   * Updates state to indicate user chose to skip 2FA
   */
  const handleSkipTotp = () => {
    if(props.setTotpChoiceMade) props.setTotpChoiceMade(true);
    props.setLoggedInTotp(false);
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
          <Col xs={12} sm={10} md={8} lg={6}>
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
                      width: '90px',
                      height: '90px',
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                      boxShadow: '0 8px 25px rgba(30, 58, 138, 0.3)'
                    }}
                  >
                    <i className="bi bi-shield-check text-white" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                  <h2 
                    className="fw-bold mb-3"
                    style={{ 
                      color: '#1e3a8a',
                      fontFamily: 'serif'
                    }}
                  >
                    Enhanced Security
                  </h2>
                  <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                    You can enable Two-Factor Authentication (2FA) for additional security when accessing your restaurant account.
                  </p>
                  {/* Important notice about 2FA requirement */}
                  <div 
                    className="p-4 rounded-3 mb-4"
                    style={{
                      background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                      border: '2px solid #f5c842'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-center">
                      <i className="bi bi-info-circle text-warning me-3" style={{ fontSize: '1.5rem' }}></i>
                      <div className="text-center">
                        <strong className="text-warning-emphasis d-block">Important Notice</strong>
                        <span className="text-warning-emphasis">2FA authentication is required to cancel orders</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="d-grid gap-4">
                  <Button 
                    variant="success"
                    size="lg" 
                    onClick={handleUseTotp}
                    className="fw-bold py-4 border-0"
                    style={{
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                      boxShadow: '0 10px 30px rgba(30, 58, 138, 0.3)',
                      fontSize: '1.1rem'
                    }}
                  >
                    <i className="bi bi-shield-lock me-3" style={{ fontSize: '1.2rem' }}></i>
                    Enable 2FA Security
                  </Button>
                  <Button 
                    variant="outline-secondary"
                    size="lg"
                    onClick={handleSkipTotp}
                    className="fw-bold py-4 border-0"
                    style={{
                      borderRadius: '20px',
                      background: 'rgba(108, 117, 125, 0.1)',
                      color: '#6c757d',
                      fontSize: '1.1rem'
                    }}
                  >
                    <i className="bi bi-skip-forward me-3" style={{ fontSize: '1.2rem' }}></i>
                    Skip 2FA for now
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export { GenericLayout, OrderPageLayout, NotFoundLayout, OrderLayout, OrderHistoryLayout, LoginLayout, TotpLayout, MenuLayout, OrderConfigurator, ChooseTotpLayout };