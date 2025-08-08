
import React, { useState } from 'react';
import { Plus, X, DollarSign, Users, Calculator, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Traveler {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  category: 'food' | 'transport' | 'accommodation' | 'activities' | 'other';
  date: string;
}

interface ExpenseSplitterProps {
  travelers: Traveler[];
}

const ExpenseSplitter: React.FC<ExpenseSplitterProps> = ({ travelers }) => {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      description: 'Dinner at Ramen Yokocho',
      amount: 120,
      paidBy: '1',
      splitBetween: ['1', '2', '3'],
      category: 'food',
      date: '2024-12-16'
    },
    {
      id: '2',
      description: 'Tokyo Metro Passes',
      amount: 75,
      paidBy: '2',
      splitBetween: ['1', '2', '3'],
      category: 'transport',
      date: '2024-12-16'
    },
    {
      id: '3',
      description: 'Senso-ji Temple Souvenirs',
      amount: 45,
      paidBy: '1',
      splitBetween: ['1'],
      category: 'other',
      date: '2024-12-16'
    }
  ]);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: '',
    splitBetween: [] as string[],
    category: 'food' as const
  });

  const calculateBalances = () => {
    const balances: { [key: string]: number } = {};
    
    // Initialize balances
    travelers.forEach(traveler => {
      balances[traveler.id] = 0;
    });

    expenses.forEach(expense => {
      const splitAmount = expense.amount / expense.splitBetween.length;
      
      // Add to the person who paid
      balances[expense.paidBy] += expense.amount;
      
      // Subtract from everyone who should pay their share
      expense.splitBetween.forEach(travelerId => {
        balances[travelerId] -= splitAmount;
      });
    });

    return balances;
  };

  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.paidBy || newExpense.splitBetween.length === 0) {
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      paidBy: newExpense.paidBy,
      splitBetween: newExpense.splitBetween,
      category: newExpense.category,
      date: new Date().toISOString().split('T')[0]
    };

    setExpenses(prev => [...prev, expense]);
    setNewExpense({
      description: '',
      amount: '',
      paidBy: '',
      splitBetween: [],
      category: 'food'
    });
    setShowAddExpense(false);
  };

  const toggleSplitBetween = (travelerId: string) => {
    setNewExpense(prev => ({
      ...prev,
      splitBetween: prev.splitBetween.includes(travelerId)
        ? prev.splitBetween.filter(id => id !== travelerId)
        : [...prev.splitBetween, travelerId]
    }));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return 'text-ai-warning';
      case 'transport': return 'text-ai-primary';
      case 'accommodation': return 'text-ai-secondary';
      case 'activities': return 'text-ai-tertiary';
      default: return 'text-foreground-muted';
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'food': return 'bg-ai-warning/10';
      case 'transport': return 'bg-ai-primary/10';
      case 'accommodation': return 'bg-ai-secondary/10';
      case 'activities': return 'bg-ai-tertiary/10';
      default: return 'bg-foreground-muted/10';
    }
  };

  const balances = calculateBalances();
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calculator className="w-6 h-6 text-ai-success" />
          <h2 className="text-2xl font-semibold text-ai-accent">Expense Splitter</h2>
        </div>
        <Button
          onClick={() => setShowAddExpense(true)}
          className="ai-button-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-ai-success">${totalExpenses.toFixed(2)}</div>
          <p className="text-foreground-muted">Total Expenses</p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-ai-primary">{expenses.length}</div>
          <p className="text-foreground-muted">Total Items</p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-ai-secondary">${(totalExpenses / travelers.length).toFixed(2)}</div>
          <p className="text-foreground-muted">Per Person</p>
        </div>
      </div>

      {/* Balances */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5 text-ai-secondary" />
          <span>Current Balances</span>
        </h3>
        <div className="space-y-3">
          {travelers.map(traveler => {
            const balance = balances[traveler.id];
            const isOwed = balance > 0;
            const owes = balance < 0;
            
            return (
              <div key={traveler.id} className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-ai-primary/20 flex items-center justify-center text-xs font-medium text-ai-primary">
                    {traveler.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="font-medium text-foreground">{traveler.name}</span>
                </div>
                <div className={`font-semibold ${
                  isOwed ? 'text-ai-success' : owes ? 'text-ai-warning' : 'text-foreground-muted'
                }`}>
                  {balance === 0 ? 'Settled' : 
                   isOwed ? `+$${balance.toFixed(2)}` : 
                   `$${Math.abs(balance).toFixed(2)}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expenses List */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
          <Receipt className="w-5 h-5 text-ai-tertiary" />
          <span>Recent Expenses</span>
        </h3>
        <div className="space-y-4">
          {expenses.map(expense => {
            const paidByTraveler = travelers.find(t => t.id === expense.paidBy);
            const splitAmount = expense.amount / expense.splitBetween.length;
            
            return (
              <div key={expense.id} className="p-4 rounded-lg bg-background-tertiary">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-foreground">{expense.description}</h4>
                    <p className="text-sm text-foreground-muted">
                      Paid by {paidByTraveler?.name} • {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">${expense.amount.toFixed(2)}</div>
                    <div className={`text-xs px-2 py-1 rounded-full ${getCategoryBg(expense.category)} ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-foreground-muted">Split between:</span>
                    <div className="flex -space-x-1">
                      {expense.splitBetween.map(travelerId => {
                        const traveler = travelers.find(t => t.id === travelerId);
                        return (
                          <div
                            key={travelerId}
                            className="w-6 h-6 rounded-full bg-ai-primary/20 border border-white flex items-center justify-center text-xs font-medium text-ai-primary"
                            title={traveler?.name}
                          >
                            {traveler?.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <span className="text-foreground-muted">
                    ${splitAmount.toFixed(2)} each
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Add New Expense</h3>
              <Button
                onClick={() => setShowAddExpense(false)}
                className="ai-button-secondary"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 rounded-lg bg-background-tertiary text-foreground border border-foreground-muted/20"
                  placeholder="What was this expense for?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Amount</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full p-2 rounded-lg bg-background-tertiary text-foreground border border-foreground-muted/20"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Paid by</label>
                <select
                  value={newExpense.paidBy}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, paidBy: e.target.value }))}
                  className="w-full p-2 rounded-lg bg-background-tertiary text-foreground border border-foreground-muted/20"
                >
                  <option value="">Select who paid</option>
                  {travelers.map(traveler => (
                    <option key={traveler.id} value={traveler.id}>{traveler.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full p-2 rounded-lg bg-background-tertiary text-foreground border border-foreground-muted/20"
                >
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="activities">Activities</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Split between</label>
                <div className="space-y-2">
                  {travelers.map(traveler => (
                    <div key={traveler.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newExpense.splitBetween.includes(traveler.id)}
                        onChange={() => toggleSplitBetween(traveler.id)}
                        className="rounded border-foreground-muted/20"
                      />
                      <span className="text-foreground">{traveler.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={addExpense}
                  className="flex-1 ai-button-primary"
                >
                  Add Expense
                </Button>
                <Button
                  onClick={() => setShowAddExpense(false)}
                  className="ai-button-secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseSplitter;
