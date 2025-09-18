
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  User as UserIcon,
  Save,
  Shield,
  Mail,
  Phone,
  Building,
  Users
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Label,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/design-system-components";
import { airtableSync } from "@/api/functions";
import ConfirmationToast from "../components/ConfirmationToast";

export default function AddUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    FullName: "",
    Email: "",
    Role: "Coach",
    PhoneNumber: "", // This field remains in state for backend submission, but its input is removed from UI.
    Department: ""
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await airtableSync({
        action: 'create',
        tableName: 'Users',
        recordData: {
          ...formData,
          PhoneNumber: formData.PhoneNumber || undefined, // Still pass PhoneNumber, though it's not in UI.
          Department: formData.Department || undefined
        }
      });

      if (response.data?.success) {
        setConfirmationConfig({
          type: 'success',
          title: 'User Added Successfully! 👤',
          message: `${formData.FullName} has been added to the system and can now access SquadUp.`
        });
        setShowConfirmation(true);
        setTimeout(() => {
          window.location.href = createPageUrl("Dashboard");
        }, 2000);
      } else {
        setConfirmationConfig({
          type: 'error',
          title: 'Failed to Add User',
          message: 'There was an issue adding the user. Please check your information and try again.'
        });
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setConfirmationConfig({
        type: 'error',
        title: 'Failed to Add User',
        message: `An error occurred: ${error.message}. Please try again.`
      });
      setShowConfirmation(true);
    }
    setIsSaving(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-bg-secondary rounded w-1/3"></div>
            <div className="h-96 bg-bg-secondary rounded-xl shadow-sm"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-bg-primary p-6 md:p-8 relative">
        {/* Ambient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-secondary-50/50 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
        
        <div className="max-w-2xl mx-auto space-y-8 relative">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" size="icon" className="border-border-custom text-text-primary hover:bg-bg-secondary hover:border-accent-primary transition-all duration-300">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                Add New <span className="text-accent-primary">User</span>
              </h1>
              <p className="text-text-secondary text-lg font-mono">Create a new user account</p>
            </div>
          </div>

          {/* Form Card */}
          <Card className="shadow-2xl border border-accent-primary/20 bg-bg-secondary/70 backdrop-blur-sm relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
            
            <CardHeader className="border-b border-border-custom/50 relative">
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/30 to-cyan-400/0"></div>
              <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-accent-secondary/20">
                  <Shield className="w-5 h-5 text-text-primary" />
                </div>
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-text-primary font-medium flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-accent-primary" />
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.FullName}
                      onChange={(e) => handleChange('FullName', e.target.value)}
                      placeholder="Enter full name"
                      className="bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-accent-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-text-primary font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-accent-primary" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.Email}
                      onChange={(e) => handleChange('Email', e.target.value)}
                      placeholder="Enter email address"
                      className="bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-accent-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-text-primary font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent-secondary" />
                      Role *
                    </Label>
                    <Select value={formData.Role} onValueChange={(value) => handleChange('Role', value)}>
                      <SelectTrigger className="bg-bg-secondary border-border-custom text-text-primary focus:border-accent-primary focus:ring-accent-primary/20">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-bg-secondary border-border-custom text-text-primary">
                        <SelectItem value="Coach" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">Coach</SelectItem>
                        <SelectItem value="Division Manager" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">Division Manager</SelectItem>
                        <SelectItem value="Department Manager" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">Department Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-text-primary font-medium flex items-center gap-2">
                      <Building className="w-4 h-4 text-success" />
                      Department
                    </Label>
                    <Select value={formData.Department} onValueChange={(value) => handleChange('Department', value)}>
                      <SelectTrigger className="bg-bg-secondary border-border-custom text-text-primary focus:border-accent-primary focus:ring-accent-primary/20">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-bg-secondary border-border-custom text-text-primary">
                        <SelectItem value="Senior Division" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">Senior Division</SelectItem>
                        <SelectItem value="Middle Division" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">Middle Division</SelectItem>
                        <SelectItem value="Youth Division" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">Youth Division</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-border-custom">
                  <Link to={createPageUrl("Dashboard")}>
                    <Button variant="outline" className="border-border-custom text-text-primary hover:bg-bg-secondary hover:border-accent-primary transition-all duration-300">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={isSaving || !formData.FullName || !formData.Email}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-text-primary shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/30 transition-all duration-300"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Adding User...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Add User
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
