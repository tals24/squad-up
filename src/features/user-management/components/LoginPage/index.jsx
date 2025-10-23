import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Store JWT token
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('🟢 Login successful, token stored, navigating to dashboard');
        
        // Small delay to ensure localStorage is properly written
        setTimeout(() => {
          // Redirect to dashboard
          navigate('/Dashboard');
        }, 100);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email.trim() && formData.password.trim();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to <span className="text-cyan-400">SquadUp</span>
          </h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl border border-slate-700 bg-slate-800/70 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
              Sign In
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-400" />
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-cyan-400/20 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition-all duration-300 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-center text-slate-400 text-sm">
                Don't have access? Contact your administrator to create an account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
