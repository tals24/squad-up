
import React, { useState, useEffect } from "react";
import { 
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Database,
  Users,
  Trophy,
  ClipboardList, // Added this import
  Clock,
  Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLayout, PageHeader, DataCard, StandardButton } from "@/components/ui/design-system-components";
// Removed airtableSync - now using MongoDB backend

export default function SyncStatus() {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [tables, setTables] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    setError(null);
    setConnectionStatus('checking');
    
    try {
      // Test MongoDB connection instead of Airtable
      const response = await fetch('/api/data/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('connected');
        setTables(data.data ? Object.keys(data.data) : []);
        setLastSync(new Date());
      } else {
        setConnectionStatus('error');
        setError('MongoDB connection failed');
      }
    } catch (connectionError) {
      console.error("Connection test failed:", connectionError);
      setConnectionStatus('error');
      setError('Failed to connect to MongoDB. Please check your database connection.');
    }
    
    setIsLoading(false);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'checking': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-red-400" />;
      case 'checking': return <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />;
      default: return <WifiOff className="w-6 h-6 text-slate-400" />;
    }
  };

  const getTableIcon = (tableName) => {
    const icons = {
      'Users': Users,
      'Teams': Trophy,
      'Players': Users,
      'TimelineEvents': Database
    };
    return icons[tableName] || Database;
  };

  return (
    <PageLayout maxWidth="max-w-4xl">
      {/* Header */}
      <PageHeader
        title="Sync"
        accentWord="Status"
        subtitle="Monitor your Airtable connection and data synchronization"
      />

        {/* Connection Status Card */}
        <DataCard
          title="Airtable Connection"
          titleIcon={<Wifi className="w-6 h-6 text-cyan-400" />}
          headerClassName="flex items-center justify-between"
        >
          <div className="flex items-center justify-end mb-4">
            <StandardButton 
              onClick={checkConnection} 
              disabled={isLoading}
              variant="outline"
              icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Test Connection
            </StandardButton>
          </div>
          <div className="flex items-center justify-between p-6 rounded-xl bg-slate-900/50 border border-slate-700">
              <div className="flex items-center gap-4">
                {getStatusIcon()}
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {connectionStatus === 'connected' && 'Connected'}
                    {connectionStatus === 'error' && 'Connection Failed'}
                    {connectionStatus === 'checking' && 'Checking Connection...'}
                  </h3>
                  <p className={`text-sm ${getStatusColor()}`}>
                    {connectionStatus === 'connected' && 'Successfully connected to Airtable base'}
                    {connectionStatus === 'error' && (error || 'Unable to connect to Airtable')}
                    {connectionStatus === 'checking' && 'Testing connection to Airtable...'}
                  </p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`
                  ${connectionStatus === 'connected' ? 'bg-success/10 text-success border-green-500/30' : ''}
                  ${connectionStatus === 'error' ? 'bg-error/10 text-error border-red-500/30' : ''}
                  ${connectionStatus === 'checking' ? 'bg-warning/10 text-warning border-yellow-500/30' : ''}
                `}
              >
                {connectionStatus === 'connected' && 'Active'}
                {connectionStatus === 'error' && 'Failed'}
                {connectionStatus === 'checking' && 'Checking'}
              </Badge>
            </div>
            
            {lastSync && (
              <div className="flex items-center gap-2 mt-4 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                <span>Last checked: {lastSync.toLocaleString()}</span>
              </div>
            )}
        </DataCard>

        {/* Tables Status */}
        {tables.length > 0 && (
          <Card className="bg-bg-secondary/70 border-border-custom shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Database className="w-6 h-6 text-accent-primary" />
                Available Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {tables.map((table) => {
                  const IconComponent = getTableIcon(table.name);
                  return (
                    <div 
                      key={table.id} 
                      className="flex items-center gap-4 p-4 rounded-xl bg-bg-primary/50 border border-border-custom hover:shadow-md transition-all duration-200"
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <IconComponent className="w-6 h-6 text-text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-text-primary text-lg">{table.name}</h3>
                        {table.description && (
                          <p className="text-sm text-text-secondary mt-1">{table.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-green-500/30">
                        Active
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Info */}
        <Card className="bg-bg-secondary/70 border-border-custom shadow-xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Settings className="w-6 h-6 text-accent-primary" />
                Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-bg-primary/50 border border-border-custom">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">API Key</h4>
                    <p className="text-sm text-text-secondary">Personal access token configured</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-accent-primary/10 text-accent-primary border-blue-500/30">
                  Set
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-bg-primary/50 border border-border-custom">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Base ID</h4>
                    <p className="text-sm text-text-secondary">Airtable base identifier configured</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-accent-secondary/10 text-accent-secondary border-purple-500/30">
                  Set
                </Badge>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-bg-primary/50 rounded-xl border border-border-custom">
              <h4 className="font-semibold text-text-primary mb-2">Expected Tables</h4>
              <p className="text-sm text-text-secondary mb-3">
                SquadUp requires these tables in your Airtable base:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <span className="text-text-primary font-medium">• Users</span>
                <span className="text-text-primary font-medium">• Teams</span>
                <span className="text-text-primary font-medium">• Players</span>
                <span className="text-text-primary font-medium">• TimelineEvents</span>
              </div>
            </div>
          </CardContent>
        </Card>
    </PageLayout>
  );
}
