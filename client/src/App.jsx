import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Routes, Route, Navigate, useNavigate } from 'react-router';
import { GenericLayout, OrderPageLayout, NotFoundLayout, OrderLayout, OrderHistoryLayout, LoginLayout, TotpLayout, MenuLayout, OrderConfigurator, ChooseTotpLayout } from './components/Layout';
import { LoginForm, TotpForm } from './components/Auth';
import API from './API.js';

/**
 * Main Application Component
 * 
 * Handles the complete restaurant application including authentication,
 * routing, state management, and data loading for orders, ingredients, dishes, and sizes.
 */
function App() {
  const navigate = useNavigate();
  
  // Authentication states
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loggedInTotp, setLoggedInTotp] = useState(false);
  const [totpChoiceMade, setTotpChoiceMade] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Order management states
  const [orderList, setOrderList] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // UI states
  const [message, setMessage] = useState('');
  
  // Data management states
  const [dirty, setDirty] = useState(true); // Triggers reload of ingredients, dishes, sizes
  const [dirtyOrders, setDirtyOrders] = useState(false); // Triggers reload of orders
  const [ingredients, setIngredients] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [sizes, setSizes] = useState([]);

  /**
   * Centralized error handler for the application
   * Formats different types of errors and handles authentication failures
   */
  const handleErrors = (err) => {
    let msg = '';
    if (err.error)
      msg = err.error;
    else if (err.errors) {
      if (err.errors[0].msg)
        msg = err.errors[0].msg + " : " + err.errors[0].path;
    } else if (Array.isArray(err))
      msg = err[0].msg + " : " + err[0].path;
    else if (typeof err === "string") msg = String(err);
    else msg = "Unknown Error";
    setMessage(msg);
    
    // Clear message after a few seconds
    setTimeout(() => setMessage(''), 5000);
    
    // Handle specific error cases
    if (msg === 'Not authenticated') {
      // Redirect to home and clear auth states on authentication failure
      setTimeout(() => { 
        setUser(undefined); 
        setLoggedIn(false); 
        setLoggedInTotp(false); 
        navigate('/');
      }, 2000);
    } else {
      // Force data reload after other errors
      setTimeout(() => setDirty(true), 2000);
    }
  };

  // Check authentication status on app startup
  useEffect(()=> {
    const checkAuth = async() => {
      try {
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
        if (user.isTotp)
          setLoggedInTotp(true);
      } catch(err) {
        // User is not authenticated, keep default states
      }
    };
    checkAuth();
  }, []);

  // Load public data (ingredients, dishes, sizes) when dirty flag is set
  useEffect(() => {
    if (dirty) {
      Promise.all([
        API.getIngredients(),
        API.getDishes(),
        API.getSizes()
      ])
      .then(([ingredientsData, dishesData, sizesData]) => {
        setIngredients(ingredientsData);
        setDishes(dishesData);
        setSizes(sizesData);
        setDirty(false);
      })
      .catch(error => {
        console.error('Error loading public data:', error);
        handleErrors(error);
      });
    }
  }, [dirty]);

  // Load user orders when authentication status changes to logged in or when dirtyOrders flag is set
  useEffect(() => {
    if (loggedIn && !loadingOrders) {
      setLoadingOrders(true);
      API.getOrders()
        .then(ordersData => {
          setOrderList(ordersData);
          setLoadingOrders(false);
          setDirtyOrders(false); // Reset the flag after loading orders
        })
        .catch(error => {
          console.error('Error loading orders:', error);
          handleErrors(error);
          setLoadingOrders(false);
        });
    }
  }, [loggedIn, dirtyOrders]);

  /**
   * Handle user login and trigger data reload
   * Resets TOTP choice on each login
   */
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
      setTotpChoiceMade(false); // Reset TOTP choice on each login
      // Force reload data when user logs in
      setDirty(true);
    } catch (err) {
      throw err;
    }
  };

  /**
   * Handle user logout and clear all application states
   */
  const handleLogout = async () => {
    try {
      await API.logOut();
    } catch (err) {

    }
    
    // Clear all auth states - React Router will handle navigation automatically
    setLoggedIn(false);
    setLoggedInTotp(false);
    setUser(null);
    setOrderList([]);
    setTotpChoiceMade(false);
    setMessage('');
    setLoggingOut(false);
  };

  return (
    <Container fluid>
      <Routes>
        {/* Main layout with navigation for authenticated routes */}
        <Route path="/" element={
          <GenericLayout
            message={message}
            setMessage={setMessage}
            loggedIn={loggedIn}
            user={user}
            loggedInTotp={loggedInTotp}
            logout={handleLogout}
          />
        }>
          {/* Home page - redirects to orders if logged in, shows menu if not */}
          <Route index element={
            loggedIn ? (
              <Navigate replace to="/orders" />
            ) : (
              <MenuLayout 
                ingredients={ingredients}
                dishes={dishes}
                sizes={sizes}
                loading={false}
              />
            )
          } />
          {/* Orders page - requires authentication */}
          <Route path="orders" element={
            loggedIn ? (
              <OrderPageLayout
                ingredients={ingredients}
                dishes={dishes}
                sizes={sizes}
                loading={false}
                orderList={orderList}
                setOrderList={setOrderList}
                handleErrors={handleErrors}
                dirty={dirty}
                setDirty={setDirty}
                setDirtyOrders={setDirtyOrders}
              />
            ) : <Navigate replace to="/login" />
          } />
          {/* Order history page - requires authentication */}
          <Route path="history" element={
            loggedIn ? (
              <OrderHistoryLayout
                orderList={orderList}
                user={user}
                loggedInTotp={loggedInTotp}
                logout={handleLogout}
                handleErrors={handleErrors}
                setDirty={setDirty}
                setDirtyOrders={setDirtyOrders}
                loading={loadingOrders}
              />
            ) : <Navigate to="/login" replace />
          } />
        </Route>
        {/* Login page with TOTP choice handling */}
        <Route path='/login' element={ <LoginWithTotp loggedIn={loggedIn} loggingOut={loggingOut} login={handleLogin} user={user} loggedInTotp={loggedInTotp} setLoggedInTotp={setLoggedInTotp} totpChoiceMade={totpChoiceMade} setTotpChoiceMade={setTotpChoiceMade} /> } />
        {/* TOTP verification page - requires initial login */}
        <Route path='/totp' element={
          loggedIn ? (
            <TotpLayout totpSuccessful={() => { setLoggedInTotp(true); setTotpChoiceMade(true); }} />
          ) : (
            <Navigate replace to="/" />
          )
        } />
        {/* 404 page for unknown routes */}
        <Route path="*" element={<NotFoundLayout />} />
      </Routes>
    </Container>
  );
}

/**
 * Login Component with TOTP Choice Logic
 * 
 * Manages the login flow and 2FA choice after successful authentication.
 * Routes users to appropriate components based on their authentication and TOTP status.
 */
function LoginWithTotp(props) {

  if (props.loggedIn) {
    // User has completed initial login but needs to choose 2FA option
    if (props.user && props.user.canDoTotp && !props.loggedInTotp && !props.totpChoiceMade) {
      return <ChooseTotpLayout setLoggedInTotp={props.setLoggedInTotp} setTotpChoiceMade={props.setTotpChoiceMade} />;
    } 
    else {
      // User has completed login process (with or without 2FA), go to orders
      return <Navigate replace to='/orders' />;
    }
  } else {
    // User not logged in yet, show initial login form
    return <LoginLayout login={props.login} />;
  }
}

export default App;