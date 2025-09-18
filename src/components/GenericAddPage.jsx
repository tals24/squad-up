import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ConfirmationToast from "./ConfirmationToast";

/**
 * Generic Add Page Template Component
 * 
 * @param {Object} props
 * @param {string} props.entityName - Name of the entity being created (e.g., "User", "Team", "Player")
 * @param {string} props.entityDisplayName - Display name for the entity (e.g., "User", "Team", "Player")
 * @param {string} props.description - Description text for the page
 * @param {React.ReactNode} props.icon - Icon component for the card header
 * @param {React.ReactNode} props.titleIcon - Icon for the page title
 * @param {string} props.titleColor - Tailwind color class for the title highlight
 * @param {string} props.backUrl - URL to navigate back to (default: "Dashboard")
 * @param {Object} props.initialFormData - Initial form data object
 * @param {Function} props.onSubmit - Function to handle form submission (formData) => Promise
 * @param {React.ReactNode} props.children - Form fields as children
 * @param {Function} props.isFormValid - Function to validate form (formData) => boolean
 * @param {boolean} props.isLoading - Loading state for the page
 * @param {React.ReactNode} props.loadingContent - Custom loading content
 */
export default function GenericAddPage({
  entityName,
  entityDisplayName = entityName,
  description,
  icon: Icon,
  titleIcon: TitleIcon,
  titleColor = "text-brand-blue",
  backUrl = "Dashboard",
  initialFormData = {},
  onSubmit,
  children,
  isFormValid = () => true,
  isLoading = false,
  loadingContent = null
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid(formData)) return;
    
    setIsSaving(true);
    try {
      const result = await onSubmit(formData);
      
      if (result?.success) {
        setConfirmationConfig({
          type: 'success',
          title: `${entityDisplayName} Added Successfully! 🎉`,
          message: result.message || `${entityDisplayName} has been added to the system successfully.`
        });
        setShowConfirmation(true);
        
        // Navigate back after success
        setTimeout(() => {
          window.location.href = createPageUrl(backUrl);
        }, 2000);
      } else {
        throw new Error(result?.error || `Failed to add ${entityDisplayName.toLowerCase()}`);
      }
    } catch (error) {
      console.error(`Error adding ${entityDisplayName.toLowerCase()}:`, error);
      setConfirmationConfig({
        type: 'error',
        title: `Failed to Add ${entityDisplayName}`,
        message: `There was an issue adding the ${entityDisplayName.toLowerCase()}: ${error.message}`
      });
      setShowConfirmation(true);
    }
    setIsSaving(false);
  };

  // Default loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          {loadingContent || (
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-96 bg-card rounded-xl shadow-sm"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-900 p-6 md:p-8 relative">
        {/* Ambient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
        
        <div className="max-w-2xl mx-auto space-y-8 relative">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to={createPageUrl(backUrl)}>
              <Button variant="outline" size="icon" className="border-border text-muted-foreground hover:bg-accent hover:border-brand-blue transition-all duration-300">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Add New {TitleIcon && <TitleIcon className="inline w-8 h-8 mr-2" />}
                <span className={titleColor}>{entityDisplayName}</span>
              </h1>
              <p className="text-muted-foreground text-lg font-mono">{description}</p>
            </div>
          </div>

          {/* Form Card */}
          <Card className="shadow-2xl border border-brand-blue/20 bg-card/70 backdrop-blur-sm relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
            
            <CardHeader className="border-b border-border/50 relative">
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-brand-blue/0 via-brand-blue/30 to-brand-blue/0"></div>
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                {Icon && (
                  <div className="w-10 h-10 bg-gradient-to-r from-brand-purple to-brand-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-purple/20">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                )}
                {entityDisplayName} Information
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dynamic form fields */}
                {React.Children.map(children, child => 
                  React.cloneElement(child, { 
                    formData, 
                    handleChange,
                    onChange: handleChange // Alternative prop name for flexibility
                  })
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-border">
                  <Link to={createPageUrl(backUrl)}>
                    <Button variant="outline" className="border-border text-muted-foreground hover:bg-accent hover:border-brand-blue transition-all duration-300">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={isSaving || !isFormValid(formData)}
                    className="bg-gradient-to-r from-brand-blue to-brand-blue-600 hover:from-brand-blue-400 hover:to-brand-blue-500 text-brand-blue-foreground shadow-lg shadow-brand-blue/20 hover:shadow-brand-blue/30 transition-all duration-300"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Adding {entityDisplayName}...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Add {entityDisplayName}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmationToast
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        type={confirmationConfig.type}
      />
    </>
  );
}
