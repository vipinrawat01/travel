
import React, { useState } from 'react';
import { DollarSign, TrendingDown, AlertCircle, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tripService } from '@/services/tripService';

interface BudgetItem {
  category: string;
  allocated: number;
  spent: number;
  savings?: number;
  items?: any[];
}

interface BudgetTrackerProps {
  selectedFlight?: any;
  selectedHotel?: any;
  selectedAttractions?: any[];
  selectedRestaurants?: any[];
  selectedTransport?: any[];
  initialBudget?: number;
}

const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  selectedFlight,
  selectedHotel,
  selectedAttractions = [],
  selectedRestaurants = [],
  selectedTransport = [],
  initialBudget
}) => {
  const [removedItems, setRemovedItems] = useState<string[]>([]);
  const [isEstimating, setIsEstimating] = useState(false);

  // Calculate actual costs based on selections
  const flightCost = selectedFlight ? selectedFlight.price : 0;
  const hotelCost = selectedHotel ? selectedHotel.price * 4 : 0; // 4 nights
  const attractionsCost = selectedAttractions.reduce((sum, attraction) => sum + (attraction.price || 0), 0);
  const foodCost = selectedRestaurants.reduce((sum, restaurant) => sum + (restaurant.averageMeal || 0), 0);
  const transportCost = selectedTransport.reduce((sum, transport) => sum + (transport.pricePerDay * 4), 0);

  // Use initialBudget if provided, otherwise use default allocations
  const totalBudget = initialBudget || 3200;
  
  // Calculate proportional allocations based on initialBudget
  const getProportionalAllocation = (defaultAmount: number) => {
    if (!initialBudget) return defaultAmount;
    const defaultTotal = 3200; // Default total budget
    return Math.round((defaultAmount / defaultTotal) * initialBudget);
  };

  const budgetData: BudgetItem[] = [
    { 
      category: 'Flights', 
      allocated: getProportionalAllocation(1200), 
      spent: flightCost,
      savings: flightCost > 0 && flightCost < getProportionalAllocation(1200) ? getProportionalAllocation(1200) - flightCost : 0,
      items: selectedFlight ? [selectedFlight] : []
    },
    { 
      category: 'Hotels', 
      allocated: getProportionalAllocation(800), 
      spent: hotelCost,
      savings: hotelCost > 0 && hotelCost < getProportionalAllocation(800) ? getProportionalAllocation(800) - hotelCost : 0,
      items: selectedHotel ? [selectedHotel] : []
    },
    { 
      category: 'Food', 
      allocated: getProportionalAllocation(400), 
      spent: foodCost,
      items: selectedRestaurants
    },
    { 
      category: 'Attractions', 
      allocated: getProportionalAllocation(300), 
      spent: attractionsCost,
      items: selectedAttractions
    },
    { 
      category: 'Transport', 
      allocated: getProportionalAllocation(200), 
      spent: transportCost,
      items: selectedTransport
    },
    { 
      category: 'Shopping', 
      allocated: getProportionalAllocation(300), 
      spent: 0,
      items: []
    }
  ];

  const totalSpent = budgetData.reduce((sum, item) => sum + item.spent, 0);
  const totalSavings = budgetData.reduce((sum, item) => sum + (item.savings || 0), 0);
  const isOverBudget = totalSpent > totalBudget;
  const overspend = isOverBudget ? totalSpent - totalBudget : 0;

  const getProgressColor = (spent: number, allocated: number) => {
    const percentage = (spent / allocated) * 100;
    if (percentage === 0) return 'bg-foreground-muted';
    if (percentage <= 80) return 'bg-ai-success';
    if (percentage <= 100) return 'bg-ai-warning';
    return 'bg-ai-danger';
  };

  const removeItem = (category: string, itemId: string) => {
    setRemovedItems(prev => [...prev, `${category}-${itemId}`]);
  };

  const getOptimizationSuggestions = () => {
    if (!isOverBudget) return [];

    const suggestions = [];
    
    // Check expensive restaurants
    const expensiveRestaurants = selectedRestaurants.filter(r => r.averageMeal > 50);
    if (expensiveRestaurants.length > 0) {
      suggestions.push({
        type: 'food',
        message: `Consider removing ${expensiveRestaurants.length} expensive restaurant(s) to save $${expensiveRestaurants.reduce((sum, r) => sum + r.averageMeal, 0)}`,
        items: expensiveRestaurants
      });
    }

    // Check paid attractions
    const paidAttractions = selectedAttractions.filter(a => a.price > 0);
    if (paidAttractions.length > 2) {
      suggestions.push({
        type: 'attractions',
        message: `You have ${paidAttractions.length} paid attractions. Consider visiting only the top 2 to save $${paidAttractions.slice(2).reduce((sum, a) => sum + a.price, 0)}`,
        items: paidAttractions.slice(2)
      });
    }

    return suggestions;
  };

  const optimizationSuggestions = getOptimizationSuggestions();

  const handleEstimate = async () => {
    try {
      if (isEstimating) return;
      setIsEstimating(true);
      const tripId = localStorage.getItem('currentTripId');
      if (!tripId || tripId === 'null' || tripId === 'undefined') return;
      await tripService.estimateBudget(tripId);
      // Ask the rest of the app to refresh saved stages; Live Itinerary will rehydrate prices via stages/items
      try { window.dispatchEvent(new Event('itinerary:refresh')); } catch {}
    } finally {
      setIsEstimating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-6">
        <DollarSign className="w-6 h-6 text-ai-success" />
        <h2 className="text-2xl font-semibold text-ai-accent">Budget Tracker</h2>
      </div>

      {/* Budget Overview */}
      <div className={`glass-card p-6 mb-6 ${isOverBudget ? 'border border-ai-danger' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-foreground-muted mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-foreground">${totalBudget}</p>
          </div>
          <div className="text-center">
            <p className="text-foreground-muted mb-1">Current Spend</p>
            <p className={`text-2xl font-bold ${isOverBudget ? 'text-ai-danger' : 'text-ai-primary'}`}>
              ${totalSpent}
            </p>
          </div>
          <div className="text-center">
            <p className="text-foreground-muted mb-1">
              {isOverBudget ? 'Over Budget' : 'Saved'}
            </p>
            <p className={`text-2xl font-bold ${isOverBudget ? 'text-ai-danger' : 'text-ai-success'}`}>
              ${isOverBudget ? overspend : totalSavings}
            </p>
          </div>

        <div className="mt-4 text-center">
          <Button onClick={handleEstimate} className="ai-button-secondary" disabled={isEstimating}>
            {isEstimating ? 'Estimating...' : 'Estimate Missing Prices with AI'}
          </Button>
        </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-foreground-muted">Overall Progress</span>
            <span className={`${isOverBudget ? 'text-ai-danger' : 'text-foreground'}`}>
              {Math.round((totalSpent / totalBudget) * 100)}%
            </span>
          </div>
          <div className="w-full bg-background-tertiary rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(totalSpent, totalBudget)}`}
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
        </div>

        {isOverBudget && (
          <div className="mt-4 p-4 rounded-lg bg-ai-danger/10 border border-ai-danger/20">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-ai-danger" />
              <h3 className="font-semibold text-ai-danger">Budget Exceeded!</h3>
            </div>
            <p className="text-sm text-foreground-muted">
              You're ${overspend} over budget. Consider the optimization suggestions below.
            </p>
          </div>
        )}
      </div>

      {/* Optimization Suggestions */}
      {optimizationSuggestions.length > 0 && (
        <div className="glass-card-secondary p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-ai-warning" />
            <span>Budget Optimization Suggestions</span>
          </h3>
          
          {optimizationSuggestions.map((suggestion, index) => (
            <div key={index} className="p-4 rounded-lg bg-ai-warning/10 border border-ai-warning/20 mb-3">
              <p className="text-sm text-foreground-secondary mb-2">{suggestion.message}</p>
              <div className="flex flex-wrap gap-2">
                {suggestion.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center space-x-2 px-3 py-1 rounded-full bg-background-tertiary">
                    <span className="text-xs text-foreground-muted">{item.name}</span>
                    <button
                      onClick={() => removeItem(suggestion.type, item.id)}
                      className="text-ai-danger hover:text-ai-danger/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Breakdown */}
      <div className="space-y-3">
        {budgetData.map((item, index) => (
          <div
            key={item.category}
            className="glass-card-secondary p-4 animate-slide-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">{item.category}</h3>
              <div className="flex items-center space-x-2">
                {item.savings && item.savings > 0 && (
                  <div className="flex items-center space-x-1 text-ai-success">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm">-${item.savings}</span>
                  </div>
                )}
                {item.spent > 0 ? (
                  <CheckCircle className="w-5 h-5 text-ai-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-foreground-muted" />
                )}
              </div>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span className="text-foreground-muted">
                ${item.spent} of ${item.allocated}
              </span>
              <span className={`${item.spent > item.allocated ? 'text-ai-danger' : 'text-foreground'}`}>
                {item.spent > 0 ? Math.round((item.spent / item.allocated) * 100) : 0}%
              </span>
            </div>

            <div className="w-full bg-background-tertiary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(item.spent, item.allocated)}`}
                style={{ width: `${item.spent > 0 ? Math.min((item.spent / item.allocated) * 100, 100) : 0}%` }}
              />
            </div>

            {/* Show selected items */}
            {item.items && item.items.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-foreground-muted mb-2">Selected Items:</p>
                <div className="flex flex-wrap gap-2">
                  {item.items.map((selectedItem: any, i: number) => (
                    <div key={i} className="px-2 py-1 rounded-full bg-background-tertiary text-xs text-foreground-muted">
                      {selectedItem.name} 
                      {selectedItem.price && ` - $${selectedItem.price}`}
                      {selectedItem.averageMeal && ` - $${selectedItem.averageMeal}`}
                      {selectedItem.pricePerDay && ` - $${selectedItem.pricePerDay}/day`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.savings && item.savings > 0 && (
              <p className="text-xs text-ai-success mt-2">
                💡 Saved ${item.savings} with AI recommendations
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetTracker;
