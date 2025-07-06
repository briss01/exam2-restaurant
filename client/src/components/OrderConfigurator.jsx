import { useState, useEffect } from 'react';
import { Row, Col, Card, Button, ListGroup, Form, Alert, Modal, Badge, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../API.js';

/**
 * OrderConfigurator Component
 * 
 * Main component for configuring restaurant orders. Allows users to select dishes,
 * sizes, and ingredients with validation for dependencies, incompatibilities, and availability.
 * Handles the complete order creation process with real-time price calculation.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.ingredients - Available ingredients with availability and constraints
 * @param {Array} props.dishes - Available base dishes
 * @param {Array} props.sizes - Available dish sizes with ingredient limits
 * @param {Function} props.handleErrors - Error handling function from parent
 * @param {Function} props.setDirty - Function to trigger data refresh in parent
 */
function OrderConfigurator(props) {
  const { ingredients, dishes, sizes, handleErrors, setDirty } = props;
  
  // State for order configuration
  const [selectedDish, setSelectedDish] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [price, setPrice] = useState(0);
  const [error, setError] = useState('');
  
  // State for modal feedback
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  const navigate = useNavigate();

  /**
   * Calculate total price whenever size or ingredients change
   * Updates price based on selected size base price plus ingredient costs
   */
  useEffect(() => {
    let basePrice = 0;
    if(selectedSize) {
      basePrice = selectedSize.price;
    }
    let ingredientsPrice = selectedIngredients.reduce((sum, ing) => sum + ing.price, 0);
    setPrice(basePrice + ingredientsPrice);
  }, [selectedSize, selectedIngredients]);

  /**
   * Handle dish selection
   * Resets size and ingredients when a new dish is selected
   * 
   * @param {Object} dish - Selected dish object
   */
  const handleDishSelect = (dish) => {
    setSelectedDish(dish);
    setSelectedSize(null);
    setSelectedIngredients([]);
    setError('');
  };

  /**
   * Handle size selection with ingredient limit validation
   * Checks if current ingredient selection exceeds the size's ingredient limit
   * 
   * @param {Object} size - Selected size object
   */
  const handleSizeSelect = (size) => {
    const limit = size.max_ingredients;
    if (selectedIngredients.length > limit) {
      setModalMessage(`${size.name} dishes can only have up to ${limit} ingredients. Please remove ${selectedIngredients.length - limit} ingredient(s) first.`);
      setShowModal(true);
      return;
    }
    setSelectedSize(size);
    setError('');
  };

  /**
   * Check if an ingredient's dependencies are satisfied
   * Validates that all required ingredients are already selected
   * 
   * @param {Object} ingredient - Ingredient to check dependencies for
   * @param {Array} currentIngredients - Currently selected ingredients
   * @returns {Object} Validation result with valid flag and optional message
   */
  const checkDependencies = (ingredient, currentIngredients) => {
    if (!ingredient.dependencies || ingredient.dependencies.length === 0) return { valid: true };
    
    const missingDeps = ingredient.dependencies.filter(dep => 
      !currentIngredients.some(ing => ing.name === dep)
    );
    
    if (missingDeps.length > 0) {
      return { 
        valid: false, 
        message: `${ingredient.name} requires: ${missingDeps.join(', ')}` 
      };
    }
    return { valid: true };
  };

  /**
   * Check if an ingredient conflicts with currently selected ingredients
   * Validates that no incompatible ingredients are already selected
   * 
   * @param {Object} ingredient - Ingredient to check incompatibilities for
   * @param {Array} currentIngredients - Currently selected ingredients
   * @returns {Object} Validation result with valid flag and optional message
   */
  const checkIncompatibilities = (ingredient, currentIngredients) => {
    if (!ingredient.incompatibilities || ingredient.incompatibilities.length === 0) return { valid: true };
    
    const conflicts = ingredient.incompatibilities.filter(incomp => 
      currentIngredients.some(ing => ing.name === incomp)
    );
    
    if (conflicts.length > 0) {
      return { 
        valid: false, 
        message: `${ingredient.name} is incompatible with: ${conflicts.join(', ')}` 
      };
    }
    return { valid: true };
  };

  /**
   * Check if an ingredient can be removed without breaking dependencies
   * Prevents removal of ingredients that are required by other selected ingredients
   * 
   * @param {Object} ingredient - Ingredient to check for removal
   * @param {Array} currentIngredients - Currently selected ingredients
   * @returns {Object} Removal validation with canRemove flag and optional message
   */
  const checkIfRequiredByOthers = (ingredient, currentIngredients) => {
    const dependentIngredients = currentIngredients.filter(ing => 
      ing.dependencies && ing.dependencies.includes(ingredient.name)
    );
    
    if (dependentIngredients.length > 0) {
      return {
        canRemove: false,
        message: `Cannot remove ${ingredient.name} because it's required by: ${dependentIngredients.map(ing => ing.name).join(', ')}`
      };
    }
    return { canRemove: true };
  };

  /**
   * Handle ingredient selection/deselection with comprehensive validation
   * Manages all constraints including availability, size limits, dependencies, and incompatibilities
   * 
   * @param {Object} ingredient - Ingredient to toggle selection for
   */
  const handleIngredientToggle = (ingredient) => {
    const isSelected = selectedIngredients.find(i => i.id === ingredient.id);
    
    if (isSelected) {
      // Removing ingredient - check if it's required by others
      const requiredCheck = checkIfRequiredByOthers(ingredient, selectedIngredients);
      if (!requiredCheck.canRemove) {
        setModalMessage(requiredCheck.message);
        setShowModal(true);
        return;
      }
      setSelectedIngredients(selectedIngredients.filter(i => i.id !== ingredient.id));
    } else {
      // Adding ingredient - check all constraints
      
      // Check availability
      if (ingredient.availability !== null && ingredient.availability <= 0) {
        setModalMessage(`${ingredient.name} is not available (out of stock)`);
        setShowModal(true);
        return;
      }
      
      // Check size limit
      const limit = selectedSize.max_ingredients;
      if (selectedIngredients.length >= limit) {
        setModalMessage(`${selectedSize.name} dishes can only have up to ${limit} ingredients`);
        setShowModal(true);
        return;
      }
      
      // Check dependencies
      const depCheck = checkDependencies(ingredient, selectedIngredients);
      if (!depCheck.valid) {
        setModalMessage(depCheck.message);
        setShowModal(true);
        return;
      }
      
      // Check incompatibilities
      const incompCheck = checkIncompatibilities(ingredient, selectedIngredients);
      if (!incompCheck.valid) {
        setModalMessage(incompCheck.message);
        setShowModal(true);
        return;
      }
      
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
    setError('');
  };

  /**
   * Submit the configured order to the backend
   * Performs final validation and sends order data to API
   */
  const handleSubmitOrder = () => {
    if (!selectedDish || !selectedSize) {
      setError('Please select a dish and size');
      return;
    }

    // Final validation before submission
    for (const ingredient of selectedIngredients) {
      if (ingredient.availability !== null && ingredient.availability <= 0) {
        setError(`${ingredient.name} is no longer available`);
        return;
      }
      
      const depCheck = checkDependencies(ingredient, selectedIngredients);
      if (!depCheck.valid) {
        setError(depCheck.message);
        return;
      }
      
      const incompCheck = checkIncompatibilities(ingredient, selectedIngredients);
      if (!incompCheck.valid) {
        setError(incompCheck.message);
        return;
      }
    }

    const order = {
      dishId: selectedDish.id,
      dish: selectedDish.name,
      sizeId: selectedSize.id,
      size: selectedSize.name,
      ingredients: selectedIngredients,
      total: price
    };

    API.addOrder(order)
      .then(() => {
        setDirty(true);
        setSelectedDish(null);
        setSelectedSize(null);
        setSelectedIngredients([]);
        setPrice(0);
        setError('');
      })
      .catch(err => {
        if (err.error && err.error.includes('not enough')) {
          setError(err.error + '. Please adjust your order.');
        } else {
          handleErrors(err);
        }
      });
  };

  /**
   * Get the status of an ingredient for display purposes
   * Determines if ingredient is selected, unavailable, or available
   * 
   * @param {Object} ingredient - Ingredient to get status for
   * @returns {string} Status string: 'selected', 'unavailable', or 'available'
   */
  const getIngredientStatus = (ingredient) => {
    const isSelected = selectedIngredients.find(i => i.id === ingredient.id);
    const unavailable = ingredient.availability !== null && ingredient.availability <= 0;
    
    if (unavailable) return 'unavailable';
    if (isSelected) return 'selected';
    
    if (!isSelected && selectedSize) {
      const limit = selectedSize.max_ingredients;
      if (selectedIngredients.length >= limit) return 'disabled';
      
      const depCheck = checkDependencies(ingredient, selectedIngredients);
      if (!depCheck.valid) return 'missing-deps';
      
      const incompCheck = checkIncompatibilities(ingredient, selectedIngredients);
      if (!incompCheck.valid) return 'incompatible';
    }
    
    return 'available';
  };

  /**
   * Get the appropriate icon for ingredient status display
   * 
   * @param {string} status - Ingredient status
   * @returns {string} Unicode icon character
   */
  const getIngredientIcon = (status) => {
    switch(status) {
      case 'selected': return '✓';
      case 'unavailable': return '✗';
      case 'missing-deps': return '⚠';
      case 'incompatible': return '⚡';
      case 'disabled': return '🚫';
      default: return '○';
    }
  };

  /**
   * Get the appropriate Bootstrap badge variant color based on ingredient status
   * 
   * @param {string} status - Ingredient status
   * @returns {string} Bootstrap badge variant name
   */
  const getIngredientBadgeVariant = (status) => {
    switch(status) {
      case 'selected': return 'success';
      case 'unavailable': return 'danger';
      case 'missing-deps': return 'warning';
      case 'incompatible': return 'danger';
      case 'disabled': return 'secondary';
      default: return 'light';
    }
  };

  /**
   * Calculate the current progress percentage for ingredient selection
   * 
   * @returns {number} Progress percentage (0-100)
   */
  const getCurrentProgress = () => {
    if (!selectedSize) return 0;
    const limit = selectedSize.max_ingredients;
    return (selectedIngredients.length / limit) * 100;
  };

  return (
    <div className="fade-in" style={{backgroundColor: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', minHeight: '100vh', padding: '20px 0'}}>
      <Row className="g-4">
        <Col lg={8}>
          <Card className="h-100 border-0" style={{borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)'}}>
            <Card.Header className="d-flex justify-content-between align-items-center border-0" 
                         style={{background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', borderRadius: '20px 20px 0 0', padding: '20px'}}>
              <h4 className="mb-0 text-white fw-bold" style={{fontFamily: 'serif'}}>
                <i className="bi bi-list-check me-2"></i>
                Available Ingredients
              </h4>
              <Badge className="px-3 py-2 fw-bold" 
                     style={{background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '15px', fontSize: '1rem'}}>
                {selectedSize ? `${selectedIngredients.length}/${selectedSize.max_ingredients}` : '0/0'}
              </Badge>
            </Card.Header>
            
            {selectedSize && (
              <div style={{background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', padding: '20px', borderBottom: '1px solid #e0e0e0'}}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted fw-semibold">Ingredients Progress</small>
                  <small className="text-muted fw-semibold">{selectedIngredients.length}/{selectedSize.max_ingredients}</small>
                </div>
                <ProgressBar 
                  now={getCurrentProgress()} 
                  variant={getCurrentProgress() > 80 ? 'warning' : 'success'}
                  style={{ height: '10px', borderRadius: '10px' }}
                />
              </div>
            )}
            
            <Card.Body style={{backgroundColor: '#ffffff', padding: '0', maxHeight: '500px', overflowY: 'auto'}}>
              {!selectedSize ? (
                <div className="text-center py-5">
                  <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🍽️</div>
                  <h5 className="mb-3" style={{color: '#374151'}}>Select a dish and size first</h5>
                  <p className="text-muted">Choose your base dish and size to see available ingredients</p>
                </div>
              ) : (
                ingredients && ingredients.map(ing => {
                  const status = getIngredientStatus(ing);
                  const isSelected = status === 'selected';
                  const isDisabled = status === 'unavailable' || 
                                   (status === 'disabled' && !isSelected) ||
                                   (status === 'missing-deps' && !isSelected) ||
                                   (status === 'incompatible' && !isSelected);
                  
                  return (
                    <div 
                      key={ing.id} 
                      className={`p-4 border-bottom cursor-pointer ${isDisabled ? 'disabled' : ''}`}
                      style={{
                        backgroundColor: isSelected ? '#dbeafe' : '#ffffff',
                        borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.6 : 1,
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => !isDisabled && handleIngredientToggle(ing)}
                      onMouseEnter={(e) => {
                        if (!isDisabled && !isSelected) {
                          e.currentTarget.style.backgroundColor = '#f0f9ff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled && !isSelected) {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }
                      }}>
                      
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center" 
                                 style={{
                                   width: '45px', 
                                   height: '45px', 
                                   background: isSelected 
                                     ? 'linear-gradient(135deg, #1e3a8a, #3b82f6)' 
                                     : isDisabled 
                                       ? 'linear-gradient(135deg, #ccc, #999)'
                                       : 'linear-gradient(135deg, #e0e0e0, #bdbdbd)'
                                 }}>
                              <span className="text-white fw-bold">
                                {getIngredientIcon(status)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h6 className="mb-1 fw-bold" style={{color: isSelected ? '#1e3a8a' : '#374151'}}>
                              {ing.name}
                            </h6>
                            <div className="d-flex align-items-center gap-2">
                              <small className="text-muted">
                                {ing.availability !== null ? 
                                  `${ing.availability} available` : 
                                  'Unlimited stock'
                                }
                              </small>
                              {status === 'unavailable' && (
                                <Badge bg={getIngredientBadgeVariant(status)} style={{borderRadius: '10px'}}>Out of Stock</Badge>
                              )}
                              {status === 'selected' && (
                                <Badge bg={getIngredientBadgeVariant(status)} style={{borderRadius: '10px'}}>Selected</Badge>
                              )}
                              {status === 'missing-deps' && (
                                <Badge bg={getIngredientBadgeVariant(status)} style={{borderRadius: '10px'}}>Missing Dependencies</Badge>
                              )}
                              {status === 'incompatible' && (
                                <Badge bg={getIngredientBadgeVariant(status)} style={{borderRadius: '10px'}}>Incompatible</Badge>
                              )}
                              {status === 'disabled' && (
                                <Badge bg={getIngredientBadgeVariant(status)} style={{borderRadius: '10px'}}>Limit Reached</Badge>
                              )}
                            </div>
                            
                            {status === 'missing-deps' && (
                              <div className="mt-2">
                                <small className="text-warning fw-semibold">
                                  <i className="bi bi-exclamation-triangle me-1"></i>
                                  Requires: {ing.dependencies.join(', ')}
                                </small>
                              </div>
                            )}
                            
                            {status === 'incompatible' && (
                              <div className="mt-2">
                                <small className="text-danger fw-semibold">
                                  <i className="bi bi-x-circle me-1"></i>
                                  Incompatible with selected ingredients
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-end">
                          <span className="badge px-3 py-2 fw-bold text-white" 
                                style={{
                                  background: isSelected 
                                    ? 'linear-gradient(135deg, #1e3a8a, #3b82f6)' 
                                    : 'linear-gradient(135deg, #6b7280, #9ca3af)',
                                  borderRadius: '15px',
                                  fontSize: '0.9rem'
                                }}>
                            €{ing.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </Card.Body>
            
            <Card.Footer className="d-grid border-0" style={{padding: '20px', backgroundColor: 'linear-gradient(135deg, #eff6ff, #dbeafe)'}}>
              <Button 
                onClick={() => navigate('/history')}
                className="py-3 fw-bold border-0"
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                  borderRadius: '15px',
                  color: 'white'
                }}>
                <i className="bi bi-clock-history me-2"></i>
                View Order History
              </Button>
            </Card.Footer>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="h-100 border-0" style={{borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)'}}>
            <Card.Header className="d-flex justify-content-between align-items-center border-0" 
                         style={{background: '#1e3a8a', borderRadius: '20px 20px 0 0', padding: '20px'}}>
              <h4 className="mb-0 text-white fw-bold" style={{fontFamily: 'serif'}}>
                <i className="bi bi-journal-check me-2"></i>
                Create Your Order
              </h4>
              {price > 0 && (
                <div className="text-end">
                  <h4 className="mb-0 text-white fw-bold">€{price.toFixed(2)}</h4>
                  <small className="text-white opacity-75">Total Price</small>
                </div>
              )}
            </Card.Header>
            <Card.Body style={{backgroundColor: '#ffffff', padding: '25px'}}>
              {/* Dish Selection */}
              <div className="mb-4">
                <h5 className="mb-3 fw-bold" style={{color: '#1e3a8a', fontFamily: 'serif'}}>
                  <i className="bi bi-1-circle-fill me-2" style={{color: '#3b82f6'}}></i>
                  Choose Your Dish
                </h5>
                <div className="d-grid gap-2">
                  {dishes.map(dish => (
                    <div 
                      key={dish.id}
                      className={`p-3 border-0 rounded-3 cursor-pointer ${selectedDish?.id === dish.id ? 'selected' : ''}`}
                      style={{
                        backgroundColor: selectedDish?.id === dish.id ? '#dbeafe' : '#f8fafc',
                        borderLeft: selectedDish?.id === dish.id ? '4px solid #3b82f6' : '4px solid transparent',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDishSelect(dish)}
                      onMouseEnter={(e) => {
                        if (selectedDish?.id !== dish.id) {
                          e.target.style.backgroundColor = '#f0f9ff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedDish?.id !== dish.id) {
                          e.target.style.backgroundColor = '#f8fafc';
                        }
                      }}>
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center" 
                               style={{
                                 width: '45px', 
                                 height: '45px', 
                                 background: selectedDish?.id === dish.id 
                                   ? '#1e3a8a' 
                                   : '#9ca3af'
                               }}>
                            <i className="bi bi-bowl-hot text-white"></i>
                          </div>
                        </div>
                        <div>
                          <h6 className="mb-1 fw-bold" style={{color: '#1e3a8a'}}>{dish.name}</h6>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              {selectedDish && (
                <div className="mb-4">
                  <h5 className="mb-3 fw-bold" style={{color: '#1e3a8a', fontFamily: 'serif'}}>
                    <i className="bi bi-2-circle-fill me-2" style={{color: '#3b82f6'}}></i>
                    Choose Size & Price
                  </h5>
                  <div className="d-grid gap-2">
                    {sizes.map(size => (
                      <div 
                        key={size.id}
                        className={`p-3 border-0 rounded-3 cursor-pointer ${selectedSize?.id === size.id ? 'selected' : ''}`}
                        style={{
                          backgroundColor: selectedSize?.id === size.id ? '#dbeafe' : '#f8fafc',
                          borderLeft: selectedSize?.id === size.id ? '4px solid #3b82f6' : '4px solid transparent',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleSizeSelect(size)}
                        onMouseEnter={(e) => {
                          if (selectedSize?.id !== size.id) {
                            e.target.style.backgroundColor = '#f0f9ff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedSize?.id !== size.id) {
                            e.target.style.backgroundColor = '#f8fafc';
                          }
                        }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1 fw-bold" style={{color: '#1e3a8a'}}>{size.name}</h6>
                            <small className="text-muted">Up to {size.max_ingredients} ingredients</small>
                          </div>
                          <div className="text-end">
                            <span className="badge px-3 py-2 fw-bold text-white" 
                                  style={{background: '#4f46e5', borderRadius: '15px'}}>
                              €{size.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {selectedSize && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0" style={{color: '#1e3a8a'}}>
                      <i className="bi bi-3-circle-fill me-2" style={{color: '#d2691e'}}></i>
                      Ingredients ({selectedIngredients.length}/{selectedSize.max_ingredients})
                    </h6>
                  </div>
                  <ProgressBar 
                    now={getCurrentProgress()} 
                    variant={getCurrentProgress() > 80 ? 'warning' : 'success'}
                    style={{height: '8px', borderRadius: '10px'}}
                  />
                </div>
              )}

              {/* Selected Ingredients Summary */}
              {selectedIngredients.length > 0 && (
                <div className="mb-4">
                  <h6 className="mb-3 fw-bold" style={{color: '#374151'}}>Your Selection:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedIngredients.map(ing => (
                      <span 
                        key={ing.id} 
                        className="badge px-3 py-2 fw-bold text-white d-flex align-items-center"
                        style={{background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', borderRadius: '20px', fontSize: '0.85rem'}}>
                        {ing.name}
                        <button 
                          className="btn btn-sm ms-2 p-0 border-0 bg-transparent text-white"
                          onClick={() => handleIngredientToggle(ing)}
                          style={{fontSize: '0.8rem', lineHeight: '1'}}>
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="danger" className="mb-4" style={{borderRadius: '10px', borderLeft: '4px solid #f44336'}}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </Alert>
              )}

              {/* Submit Button */}
              <div className="d-grid">
                <Button 
                  onClick={handleSubmitOrder}
                  disabled={!selectedDish || !selectedSize}
                  className="py-3 fw-bold border-0"
                  style={{
                    background: selectedDish && selectedSize 
                      ? 'linear-gradient(135deg, #1e3a8a, #3b82f6)' 
                      : 'linear-gradient(135deg, #ccc, #999)',
                    borderRadius: '15px',
                    fontSize: '1.1rem',
                    boxShadow: selectedDish && selectedSize ? '0 4px 15px rgba(30, 58, 138, 0.3)' : 'none'
                  }}>
                  <i className="bi bi-cart-plus me-2"></i>
                  Add to Order - €{price.toFixed(2)}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0" style={{background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)'}}>
          <Modal.Title className="d-flex align-items-center gap-2 text-white fw-bold">
            <i className="bi bi-exclamation-triangle"></i>
            Order Constraint
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-4 text-center">
          <div className="mb-3" style={{ fontSize: '3rem' }}>🚫</div>
          <p className="mb-0 fw-semibold" style={{color: '#374151'}}>{modalMessage}</p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center" style={{backgroundColor: 'linear-gradient(135deg, #eff6ff, #dbeafe)'}}>
          <Button 
            onClick={() => setShowModal(false)}
            className="px-4 py-2 fw-bold border-0"
            style={{
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              borderRadius: '10px',
              color: 'white'
            }}>
            <i className="bi bi-check-circle me-2"></i>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export { OrderConfigurator };