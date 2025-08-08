
import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  Hotel, 
  CloudSun, 
  FileText, 
  DollarSign, 
  MessageSquare,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  status: 'idle' | 'working' | 'complete' | 'error';
  task: string;
  progress: number;
}

const AgentHub = () => {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'flights',
      name: 'Flight Agent',
      icon: Plane,
      status: 'working',
      task: 'Finding best flight deals',
      progress: 65
    },
    {
      id: 'hotels',
      name: 'Hotel Agent',
      icon: Hotel,
      status: 'idle',
      task: 'Searching accommodations',
      progress: 0
    },
    {
      id: 'weather',
      name: 'Weather Agent',
      icon: CloudSun,
      status: 'complete',
      task: 'Weather analysis complete',
      progress: 100
    },
    {
      id: 'visa',
      name: 'Visa Agent',
      icon: FileText,
      status: 'working',
      task: 'Checking visa requirements',
      progress: 30
    },
    {
      id: 'budget',
      name: 'Budget Agent',
      icon: DollarSign,
      status: 'idle',
      task: 'Cost optimization ready',
      progress: 0
    }
  ]);

  const [connections, setConnections] = useState([
    { from: 'flights', to: 'budget', active: true },
    { from: 'hotels', to: 'budget', active: false },
    { from: 'weather', to: 'flights', active: true },
    { from: 'visa', to: 'flights', active: false }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prevAgents => 
        prevAgents.map(agent => {
          if (agent.status === 'working' && agent.progress < 100) {
            const newProgress = Math.min(agent.progress + Math.random() * 10, 100);
            return {
              ...agent,
              progress: newProgress,
              status: newProgress === 100 ? 'complete' : 'working'
            };
          }
          return agent;
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'text-ai-warning';
      case 'complete': return 'text-ai-success';
      case 'error': return 'text-ai-danger';
      default: return 'text-foreground-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return Clock;
      case 'complete': return CheckCircle;
      case 'error': return AlertCircle;
      default: return Zap;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-hero text-3xl md:text-4xl">
            AI Agents at Work
          </h1>
          <p className="text-foreground-secondary text-lg">
            Watch your specialized AI team collaborate in real-time
          </p>
        </div>

        {/* Agent Grid */}
        <div className="relative">
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {connections.map((connection, index) => {
              const fromAgent = agents.find(a => a.id === connection.from);
              const toAgent = agents.find(a => a.id === connection.to);
              
              if (!fromAgent || !toAgent) return null;

              return (
                <line
                  key={index}
                  x1="25%"
                  y1="25%"
                  x2="75%"
                  y2="75%"
                  stroke={connection.active ? 'hsl(245 83% 67%)' : 'hsl(210 20% 98% / 0.1)'}
                  strokeWidth="2"
                  strokeDasharray={connection.active ? "0" : "5,5"}
                  className={connection.active ? "animate-pulse-flow" : ""}
                />
              );
            })}
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative" style={{ zIndex: 2 }}>
            {agents.map((agent, index) => {
              const StatusIcon = getStatusIcon(agent.status);
              const AgentIcon = agent.icon;
              
              return (
                <div
                  key={agent.id}
                  className={`agent-node transition-all duration-500 animate-slide-in-up ${
                    agent.status === 'working' ? 'ai-glow' : ''
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${
                        agent.status === 'complete' 
                          ? 'from-ai-success/20 to-ai-success/10' 
                          : agent.status === 'working'
                          ? 'from-ai-primary/20 to-ai-secondary/10'
                          : 'from-foreground-muted/20 to-foreground-muted/10'
                      }`}>
                        <AgentIcon className={`w-6 h-6 ${
                          agent.status === 'complete' 
                            ? 'text-ai-success' 
                            : agent.status === 'working'
                            ? 'text-ai-primary'
                            : 'text-foreground-muted'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{agent.name}</h3>
                        <p className="text-sm text-foreground-muted">{agent.task}</p>
                      </div>
                    </div>
                    <StatusIcon className={`w-5 h-5 ${getStatusColor(agent.status)}`} />
                  </div>

                  {/* Progress Bar */}
                  {agent.status === 'working' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-muted">Progress</span>
                        <span className="text-ai-primary">{Math.round(agent.progress)}%</span>
                      </div>
                      <div className="w-full bg-background-tertiary rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-ai-primary to-ai-secondary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${agent.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className={`mt-4 px-3 py-1 rounded-full text-xs font-medium inline-flex items-center space-x-1 ${
                    agent.status === 'complete' 
                      ? 'bg-ai-success/20 text-ai-success'
                      : agent.status === 'working'
                      ? 'bg-ai-primary/20 text-ai-primary'
                      : 'bg-foreground-muted/20 text-foreground-muted'
                  }`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="capitalize">{agent.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Central Chat Interface */}
        <div className="glass-card p-6 max-w-2xl mx-auto">
          <div className="flex items-center space-x-3 mb-4">
            <MessageSquare className="w-6 h-6 text-ai-primary" />
            <h2 className="text-xl font-semibold text-ai-accent">Live Collaboration</h2>
          </div>
          
          <div className="space-y-3 max-h-40 overflow-y-auto">
            <div className="flex items-start space-x-3 text-sm">
              <div className="w-2 h-2 bg-ai-success rounded-full mt-2 flex-shrink-0" />
              <p className="text-foreground-secondary">
                <span className="text-ai-success font-medium">Weather Agent:</span> Perfect weather in Tokyo next week. 22-28°C, minimal rain.
              </p>
            </div>
            <div className="flex items-start space-x-3 text-sm">
              <div className="w-2 h-2 bg-ai-warning rounded-full mt-2 flex-shrink-0 animate-pulse" />
              <p className="text-foreground-secondary">
                <span className="text-ai-warning font-medium">Flight Agent:</span> Found 3 optimal routes. Coordinating with Budget Agent...
              </p>
            </div>
            <div className="flex items-start space-x-3 text-sm">
              <div className="w-2 h-2 bg-ai-primary rounded-full mt-2 flex-shrink-0 animate-pulse" />
              <p className="text-foreground-secondary">
                <span className="text-ai-primary font-medium">Visa Agent:</span> No visa required for your passport. Ready to proceed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentHub;
