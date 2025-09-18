
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Trophy,
  Save,
  Users,
  Shield,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { airtableSync } from "@/api/functions";
import ConfirmationToast from "../components/ConfirmationToast";

export default function AddTeam() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    Name: "",
    Division: "",
    Season: "",
    Coach: "",
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

      const usersResponse = await airtableSync({ action: 'fetch', tableName: 'Users' });
      if (usersResponse.data?.records) {
        setUsers(usersResponse.data.records);
      }
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
        tableName: 'Teams',
        recordData: {
          TeamName: formData.Name,
          Division: formData.Division,
          Season: formData.Season,
          Coach: formData.Coach ? [formData.Coach] : undefined,
        }
      });

      if (response.data?.success) {
        setConfirmationConfig({
          type: 'success',
          title: 'Team Created Successfully! 🏆',
          message: `${formData.Name} has been created and is ready to start the season!`
        });
        setShowConfirmation(true);
        setTimeout(() => {
          window.location.href = createPageUrl("Dashboard");
        }, 2000);
      } else {
        setConfirmationConfig({
          type: 'error',
          title: 'Failed to Create Team',
          message: 'There was an issue creating the team. Please check your information and try again.'
        });
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error("Error adding team:", error);
      setConfirmationConfig({
        type: 'error',
        title: 'Failed to Create Team',
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
      <div className="min-h-screen bg-background p-6 md:p-8">
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
      <div className="min-h-screen bg-background p-6 md:p-8 relative">
        {/* Ambient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
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
                Add New <span className="text-accent-primary">Team</span>
              </h1>
              <p className="text-text-secondary text-lg font-mono">Create a new team</p>
            </div>
          </div>

          {/* Form Card */}
          <Card className="shadow-2xl border border-accent-primary/20 bg-bg-secondary/70 backdrop-blur-sm relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
            
            <CardHeader className="border-b border-border-custom/50 relative">
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/30 to-cyan-400/0"></div>
              <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-warning/20">
                  <Trophy className="w-5 h-5 text-text-primary" />
                </div>
                Team Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-text-primary font-medium flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-warning" />
                      Team Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.Name}
                      onChange={(e) => handleChange('Name', e.target.value)}
                      placeholder="Enter team name"
                      className="bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-accent-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="division" className="text-text-primary font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent-primary" />
                      Division *
                    </Label>
                    <Select value={formData.Division} onValueChange={(value) => handleChange('Division', value)}>
                      <SelectTrigger className="bg-bg-secondary border-border-custom text-text-primary focus:border-accent-primary focus:ring-accent-primary/20">
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                      <SelectContent className="bg-bg-secondary border-border-custom text-text-primary">
                        <SelectItem value="Senior Division" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">Senior Division</SelectItem>
                        <SelectItem value="Middle Division" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">Middle Division</SelectItem>
                        <SelectItem value="Youth Division" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">Youth Division</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="season" className="text-text-primary font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-success" />
                      Season *
                    </Label>
                    <Input
                      id="season"
                      value={formData.Season}
                      onChange={(e) => handleChange('Season', e.target.value)}
                      placeholder="e.g., 2024-2025"
                      className="bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-accent-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coach" className="text-text-primary font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent-secondary" />
                      Coach
                    </Label>
                    <Select value={formData.Coach} onValueChange={(value) => handleChange('Coach', value)}>
                      <SelectTrigger className="bg-bg-secondary border-border-custom text-text-primary focus:border-accent-primary focus:ring-accent-primary/20">
                        <SelectValue placeholder="Select coach" />
                      </SelectTrigger>
                      <SelectContent className="bg-bg-secondary border-border-custom text-text-primary">
                        {users.filter(user => user.Role === 'Coach').map(user => (
                          <SelectItem key={user.UserID || user.id} value={user.UserID || user.id} className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">
                            {user.FullName || user.Email}
                          </SelectItem>
                        ))}
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
                    disabled={isSaving || !formData.Name || !formData.Division || !formData.Season}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-text-primary shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/30 transition-all duration-300"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Adding Team...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Add Team
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
