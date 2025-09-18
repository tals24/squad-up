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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      <div className="min-h-screen bg-slate-900 p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-96 bg-card rounded-xl shadow-sm"></div>
          </div>
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
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" size="icon" className="border-border text-muted-foreground hover:bg-accent hover:border-brand-blue transition-all duration-300">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Add New <span className="text-brand-blue">User</span>
              </h1>
              <p className="text-muted-foreground text-lg font-mono">Create a new user account</p>
            </div>
          </div>

          {/* Form Card */}
          <Card className="shadow-2xl border border-brand-blue/20 bg-card/70 backdrop-blur-sm relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
            
            <CardHeader className="border-b border-border/50 relative">
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-brand-blue/0 via-brand-blue/30 to-brand-blue/0"></div>
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-brand-purple to-brand-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-purple/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground font-medium flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-brand-blue" />
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.FullName}
                      onChange={(e) => handleChange('FullName', e.target.value)}
                      placeholder="Enter full name"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-brand-blue-400" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.Email}
                      onChange={(e) => handleChange('Email', e.target.value)}
                      placeholder="Enter email address"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-foreground font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand-purple-400" />
                      Role *
                    </Label>
                    <Select value={formData.Role} onValueChange={(value) => handleChange('Role', value)}>
                      <SelectTrigger className="bg-background border-border text-foreground focus:border-brand-blue focus:ring-brand-blue/20">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border text-foreground">
                        <SelectItem value="Coach" className="text-foreground focus:bg-accent hover:bg-accent">Coach</SelectItem>
                        <SelectItem value="Division Manager" className="text-foreground focus:bg-accent hover:bg-accent">Division Manager</SelectItem>
                        <SelectItem value="Department Manager" className="text-foreground focus:bg-accent hover:bg-accent">Department Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-foreground font-medium flex items-center gap-2">
                      <Building className="w-4 h-4 text-brand-green-400" />
                      Department
                    </Label>
                    <Select value={formData.Department} onValueChange={(value) => handleChange('Department', value)}>
                      <SelectTrigger className="bg-background border-border text-foreground focus:border-brand-blue focus:ring-brand-blue/20">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border text-foreground">
                        <SelectItem value="Senior Division" className="text-foreground focus:bg-accent hover:bg-accent">Senior Division</SelectItem>
                        <SelectItem value="Middle Division" className="text-foreground focus:bg-accent hover:bg-accent">Middle Division</SelectItem>
                        <SelectItem value="Youth Division" className="text-foreground focus:bg-accent hover:bg-accent">Youth Division</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-border">
                  <Link to={createPageUrl("Dashboard")}>
                    <Button variant="outline" className="border-border text-muted-foreground hover:bg-accent hover:border-brand-blue transition-all duration-300">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={isSaving || !formData.FullName || !formData.Email}
                    className="bg-gradient-to-r from-brand-blue to-brand-blue-600 hover:from-brand-blue-400 hover:to-brand-blue-500 text-brand-blue-foreground shadow-lg shadow-brand-blue/20 hover:shadow-brand-blue/30 transition-all duration-300"
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