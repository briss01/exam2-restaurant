import { Table, Button, Alert, Spinner, Container, Row, Col, Card, ListGroup, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import API from '../API.js';

/**
 * OrderHistory Component
 * 
 * Displays a user's order history with the ability to view order details and cancel orders.
 * Requires 2FA authentication for cancellation functionality.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.orderList - Array of order objects to display
 * @param {boolean} props.loggedInTotp - Whether user has completed 2FA authentication
 * @param {Function} props.handleErrors - Error handling function from parent
 * @param {Function} props.setDirtyOrders - Function to trigger orders refresh in parent
 * @param {Function} props.setDirty - Function to trigger ingredients refresh in parent
 * @param {boolean} props.loading - Loading state indicator
 */
function OrderHistory(props) {
  const { orderList = [], loggedInTotp, handleErrors, setDirtyOrders, setDirty, loading = false } = props;
  const navigate = useNavigate();
  
  // State for user feedback messages
  const [message, setMessage] = useState('');
  
  // State for cancel order confirmation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  
  /**
   * Handles the cancellation of an order
   * Requires 2FA authentication and calls the API to cancel the order
   * 
   * @param {number} orderId - The ID of the order to cancel
   */
  const handleCancelOrder = async (orderId) => {
    // Check if user has completed 2FA authentication
    if (!loggedInTotp) {
      setMessage('2FA authentication required to cancel orders');
      return;
    }
    
    try {
      // Call API to cancel the order
      await API.cancelOrder(orderId);
      setMessage('Order cancelled successfully');
      
      // Trigger reload of orders and ingredients from parent component
      if (setDirtyOrders) setDirtyOrders(true);
      if (setDirty) setDirty(true);
      
      // Close modal and reset state
      setShowCancelModal(false);
      setOrderToCancel(null);
    } catch (err) {
      // Handle errors using parent error handler or local state
      if (handleErrors) {
        handleErrors(err);
      } else {
        setMessage(err.error || 'Failed to cancel order');
      }
      setShowCancelModal(false);
    }
  };

  /**
   * Opens the cancel confirmation modal for a specific order
   * 
   * @param {Object} order - The order object to potentially cancel
   */
  const openCancelModal = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  return (
    <div style={{backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '20px'}}>
      <div className="container-fluid">
        {/* Success/Error Message Display */}
        {message && (
          <Alert 
            variant={message.includes('successfully') ? 'success' : 'danger'} 
            dismissible 
            onClose={() => setMessage('')}
            className="d-flex align-items-center gap-2 mb-4"
            style={{
              borderRadius: '15px',
              border: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}
          >
            <span>{message.includes('successfully') ? <i className="bi bi-check-circle-fill text-success"></i> : <i className="bi bi-exclamation-triangle-fill text-warning"></i>}</span>
            <span>{message}</span>
          </Alert>
        )}
        
        {/* Page Header Section */}
        <div className="card border-0 mb-4" style={{borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)'}}>
          <div className="card-header border-0" style={{background: '#1e3a8a', borderRadius: '20px 20px 0 0', padding: '30px'}}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="mb-2 fw-bold text-white" style={{fontFamily: 'serif'}}>Order History</h1>
                <p className="mb-0 text-white opacity-75" style={{fontSize: '1.1rem'}}>Track and manage your orders</p>
              </div>
              {/* Navigation Button to Order Configuration */}
              <Button 
                variant="light"
                onClick={() => navigate('/orders')}
                className="px-4 py-3 fw-bold"
                style={{
                  borderRadius: '15px',
                  boxShadow: '0 4px 15px rgba(255,255,255,0.2)',
                  minWidth: '200px'
                }}
              >
                ← Return to Order Configuration
              </Button>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {loading ? (
          <div className="card border-0 text-center py-5" style={{borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)'}}>
            <div className="card-body">
              <div className="spinner-border mb-3" style={{color: '#3b82f6', width: '3rem', height: '3rem'}}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted">Loading your orders...</h5>
              <p className="text-muted mb-0">Please wait while we fetch your order history</p>
            </div>
          </div>
        ) : orderList.length === 0 ? (
          /* Empty State - No Orders */
          <div className="card border-0 text-center py-5" style={{borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)'}}>
            <div className="card-body" style={{padding: '60px 40px'}}>
              <h2 className="mb-3" style={{color: '#1e3a8a', fontFamily: 'serif'}}>No orders yet</h2>
              <p className="text-muted mb-4" style={{fontSize: '1.2rem'}}>Ready to taste something delicious?</p>
              <Button 
                onClick={() => navigate('/orders')}
                className="px-5 py-3 fw-bold"
                style={{
                  background: '#1e3a8a',
                  border: 'none',
                  borderRadius: '15px',
                  boxShadow: '0 4px 15px rgba(30, 58, 138, 0.3)',
                  fontSize: '1.1rem'
                }}
              >
                Create Your First Order
              </Button>
            </div>
          </div>
        ) : (
          /* Orders List - Display all orders */
          <div className="d-flex flex-column gap-4">
            {orderList.map((order, index) => (
              <div key={order.id} className="card border-0" style={{borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)'}}>
                {/* Order Header with Order ID */}
                <div className="card-header border-0" 
                     style={{background: '#f8fafc', padding: '25px 30px', borderRadius: '20px 20px 0 0'}}>
                  <h4 className="mb-0 fw-bold" style={{color: '#1e3a8a'}}>Order #{order.id}</h4>
                </div>
                
                {/* Order Details Body */}
                <div className="card-body" style={{padding: '25px'}}>
                  <div className="row g-4 align-items-start">
                    {/* Left Column - Dish Information */}
                    <div className="col-md-3">
                      <div className="text-center p-3 rounded" style={{
                        background: '#f0f7ff',
                        border: '2px solid #bfdbfe'
                      }}>
                        <div className="mb-2">
                          <i className="bi bi-fork-knife" style={{fontSize: '2rem', color: '#1e3a8a'}}></i>
                        </div>
                        <h4 className="fw-bold mb-1 d-flex align-items-center justify-content-center" style={{color: '#1e3a8a', fontSize: '1.1rem'}}>
                          <i className="bi bi-utensils me-2" style={{fontSize: '1rem'}}></i>
                          {order.dish}
                        </h4>
                        <div className="d-flex flex-column align-items-center gap-1">
                          <span className="badge px-2 py-1" style={{
                            background: '#1e3a8a', 
                            color: 'white', 
                            borderRadius: '8px', 
                            fontSize: '0.8rem'
                          }}>
                            {order.size}
                          </span>
                          <small className="text-success fw-bold" style={{fontSize: '0.75rem'}}>
                            €{(order.sizePrice || 0).toFixed(2)}
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    {/* Middle Column - Ingredients List */}
                    <div className="col-md-6">
                      <div className="card border-0 h-100" style={{
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div className="card-body" style={{padding: '20px'}}>
                          <h5 className="mb-3 fw-bold d-flex align-items-center" style={{color: '#1e3a8a', fontSize: '1rem'}}>
                            <i className="bi bi-egg-fill me-2" style={{fontSize: '1.1rem'}}></i>
                            Ingredients
                          </h5>
                          {/* Display ingredients if available */}
                          {order.ingredients && order.ingredients.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                              {order.ingredients.map((ingredient, idx) => (
                                <div key={idx} className="badge px-3 py-2 d-flex align-items-center justify-content-between" 
                                     style={{
                                       background: '#ffffff', 
                                       color: '#1e3a8a',
                                       border: '1px solid #3b82f6',
                                       borderRadius: '20px',
                                       fontSize: '0.85rem',
                                       fontWeight: '500',
                                       minWidth: '120px'
                                     }}>
                                  <div className="d-flex align-items-center">
                                    <i className="bi bi-check-circle-fill me-2" style={{fontSize: '0.7rem', color: '#3b82f6'}}></i>
                                    <span>{ingredient.name}</span>
                                  </div>
                                  <span className="ms-2 fw-bold" style={{color: '#059669', fontSize: '0.8rem'}}>
                                    €{ingredient.price ? ingredient.price.toFixed(2) : '0.00'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Empty ingredients state */
                            <div className="text-center py-3" style={{
                              background: '#ffffff', 
                              border: '1px dashed #cbd5e1', 
                              borderRadius: '8px'
                            }}>
                              <i className="bi bi-dash-lg text-muted mb-1" style={{fontSize: '1.2rem'}}></i>
                              <p className="text-muted mb-0" style={{fontSize: '0.85rem'}}>
                                No additional ingredients
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Column - Price and Actions */}
                    <div className="col-md-3">
                      <div className="card border-0 h-100" style={{
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e5e7eb 100%)',
                        borderRadius: '12px',
                        border: '1px solid #d1d5db'
                      }}>
                        <div className="card-body text-center" style={{padding: '20px'}}>
                          {/* Total Price Display */}
                          <div className="mb-3">
                            <div className="mb-2">
                              <i className="bi bi-currency-euro" style={{fontSize: '1.8rem', color: '#1e3a8a'}}></i>
                            </div>
                            <h3 className="fw-bold mb-0" style={{color: '#1e3a8a', fontSize: '1.4rem'}}>
                              €{order.total.toFixed(2)}
                            </h3>
                            <small className="text-muted">Total</small>
                          </div>
                          
                          {/* Cancel Button or 2FA Requirement Notice */}
                          {loggedInTotp ? (
                            <button 
                              className="btn btn-outline-danger px-3 py-2 fw-bold w-100"
                              onClick={() => openCancelModal(order)}
                              style={{borderRadius: '8px', fontSize: '0.85rem'}}
                            >
                              <i className="bi bi-x-circle me-1"></i>
                              Cancel
                            </button>
                          ) : (
                            <div className="text-center p-2 rounded" style={{background: 'rgba(107, 114, 128, 0.1)', fontSize: '0.8rem'}}>
                              <div className="text-muted mb-1"><i className="bi bi-lock-fill" style={{fontSize: '1.2rem'}}></i></div>
                              <small className="text-muted">2FA required to cancel orders</small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Order Confirmation Modal */}
        <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
          <Modal.Header closeButton className="border-0" style={{background: '#f8fafc', padding: '25px 30px'}}>
            <Modal.Title style={{color: '#1e3a8a', fontSize: '1.5rem'}}>
              Cancel Order
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center" style={{padding: '40px 30px'}}>
            <h4 className="mb-4" style={{color: '#1e3a8a'}}>Are you sure you want to cancel this order?</h4>
            {/* Order details in modal */}
            {orderToCancel && (
              <div className="p-4 mb-4" style={{background: '#f8fafc', borderRadius: '15px', border: '2px solid #e2e8f0'}}>
                <h5 className="fw-bold mb-2" style={{color: '#1e3a8a'}}>{orderToCancel.dish}</h5>
                <p className="text-muted mb-2">{orderToCancel.size} Size</p>
                <h4 className="fw-bold" style={{color: '#1e3a8a'}}>€{orderToCancel.total.toFixed(2)}</h4>
              </div>
            )}
            <p className="text-muted">This action cannot be undone.</p>
          </Modal.Body>
          <Modal.Footer className="border-0 justify-content-center gap-3" style={{padding: '20px 30px 30px'}}>
            {/* Modal Action Buttons */}
            <Button 
              variant="secondary" 
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 fw-bold"
              style={{borderRadius: '12px', minWidth: '140px'}}
            >
              Keep Order
            </Button>
            <Button 
              variant="danger" 
              onClick={() => orderToCancel && handleCancelOrder(orderToCancel.id)}
              className="px-4 py-2 fw-bold"
              style={{borderRadius: '12px', minWidth: '140px'}}
            >
              Cancel Order
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export { OrderHistory };