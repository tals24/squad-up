
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
import { airtableSync } from "@/api/functions"; // Corrected import path

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
      const response = await airtableSync({ action: 'test' });
      
      if (response.data?.success) {
        setConnectionStatus('connected');
        setTables(response.data.tables || []);
        setLastSync(new Date());
      } else {
        setConnectionStatus('error');
        setError(response.data?.error || 'Unknown connection error');
      }
    } catch (connectionError) {
      console.error("Connection test failed:", connectionError);
      setConnectionStatus('error');
      setError('Failed to connect to Airtable. Please check your API key and Base ID.');
    }
    
    setIsLoading(false);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-success';
      case 'error': return 'text-error';
      case 'checking': return 'text-warning';
      default: return 'text-text-secondary';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-6 h-6 text-success" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-error" />;
      case 'checking': return <Loader2 className="w-6 h-6 text-warning animate-spin" />;
      default: return <WifiOff className="w-6 h-6 text-text-secondary" />;
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
    <div className="p-6 md:p-8 bg-bg-primary min-h-screen text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
            Sync <span className="text-accent-primary">Status</span>
          </h1>
          <p className="text-text-secondary text-lg">
            Monitor your Airtable connection and data synchronization
          </p>
        </div>

        {/* Connection Status Card */}
        <Card className="bg-bg-secondary/70 border-border-custom shadow-xl backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Wifi className="w-6 h-6 text-accent-primary" />
                Airtable Connection
              </CardTitle>
              <Button 
                onClick={checkConnection} 
                disabled={isLoading}
                variant="outline"
                className="border-border-custom bg-bg-secondary text-text-primary hover:bg-bg-secondary hover:text-accent-primary hover:border-accent-primary/50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-6 rounded-xl bg-bg-primary/50 border border-border-custom">
              <div className="flex items-center gap-4">
                {getStatusIcon()}
                <div>
                  <h3 className="font-bold text-lg text-text-primary">
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
              <div className="flex items-center gap-2 mt-4 text-sm text-text-secondary">
                <Clock className="w-4 h-4" />
                <span>Last checked: {lastSync.toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}
