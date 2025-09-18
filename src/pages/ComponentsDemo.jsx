import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedComponentsShowcase from '../components/UnifiedComponentsShowcase';
import { Button } from '../components/ui/design-system-components';
import { ArrowLeft } from 'lucide-react';

export default function ComponentsDemo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/dashboard')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Showcase */}
      <UnifiedComponentsShowcase />
    </div>
  );
}
