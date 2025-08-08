
import React, { useState } from 'react';
import { X, Search, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Traveler {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface TravelerSelectorProps {
  selectedTravelers: Traveler[];
  onTravelersChange: (travelers: Traveler[]) => void;
  maxTravelers?: number;
}

const TravelerSelector: React.FC<TravelerSelectorProps> = ({ 
  selectedTravelers, 
  onTravelersChange,
  maxTravelers = 10 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Mock user database
  const allUsers: Traveler[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com' },
    { id: '5', name: 'Alex Brown', email: 'alex@example.com' },
    { id: '6', name: 'Emily Davis', email: 'emily@example.com' },
    { id: '7', name: 'Chris Taylor', email: 'chris@example.com' },
    { id: '8', name: 'Lisa Anderson', email: 'lisa@example.com' }
  ];

  const filteredUsers = allUsers.filter(user => 
    !selectedTravelers.find(selected => selected.id === user.id) &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addTraveler = (traveler: Traveler) => {
    if (selectedTravelers.length < maxTravelers) {
      onTravelersChange([...selectedTravelers, traveler]);
    }
    setSearchTerm('');
  };

  const removeTraveler = (travelerId: string) => {
    onTravelersChange(selectedTravelers.filter(traveler => traveler.id !== travelerId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground">
          Trip Companions ({selectedTravelers.length}/{maxTravelers})
        </label>
        <Button
          onClick={() => setShowSearch(!showSearch)}
          className="ai-button-secondary text-xs"
          size="sm"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Traveler
        </Button>
      </div>

      {/* Selected Travelers */}
      {selectedTravelers.length > 0 && (
        <div className="space-y-2">
          {selectedTravelers.map((traveler) => (
            <div
              key={traveler.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-ai-primary/20 flex items-center justify-center text-xs font-medium text-ai-primary">
                  {traveler.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-foreground">{traveler.name}</p>
                  <p className="text-xs text-foreground-muted">{traveler.email}</p>
                </div>
              </div>
              <Button
                onClick={() => removeTraveler(traveler.id)}
                className="ai-button-secondary"
                size="sm"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Search Interface */}
      {showSearch && (
        <div className="glass-card-secondary p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-background-tertiary text-foreground border border-foreground-muted/20 focus:outline-none focus:ring-2 focus:ring-ai-primary/50"
            />
          </div>

          {/* Search Results */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {searchTerm ? (
              filteredUsers.length > 0 ? (
                filteredUsers.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    onClick={() => addTraveler(user)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-background-tertiary cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-ai-secondary/20 flex items-center justify-center text-xs font-medium text-ai-secondary">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-foreground-muted">{user.email}</p>
                    </div>
                    <Plus className="w-4 h-4 text-ai-primary" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-foreground-muted text-center py-4">
                  No users found matching "{searchTerm}"
                </p>
              )
            ) : (
              <p className="text-sm text-foreground-muted text-center py-4">
                Start typing to search for travelers
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setShowSearch(false)}
              className="ai-button-secondary text-xs"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {selectedTravelers.length === 0 && (
        <div className="text-center py-8 glass-card-secondary">
          <Users className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-muted">
            Add travelers to share this trip with them
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            They'll be able to view and collaborate on the itinerary
          </p>
        </div>
      )}
    </div>
  );
};

export default TravelerSelector;
