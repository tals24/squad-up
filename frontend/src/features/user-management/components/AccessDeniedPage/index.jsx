
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/shared/utils";
import { 
  Shield,
  AlertCircle,
  Mail,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Button } from "@/shared/ui/primitives/button";
import { User } from "@/shared/api";

export default function AccessDenied() {
  const handleTryAgain = async () => {
    try {
      await User.logout();
      window.location.reload();
    } catch (error) {
      console.error("Error logging out:", error);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-6">
      <div className="max-w-md mx-auto">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Shield className="w-12 h-12 text-text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-900 mb-2">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <p className="text-red-800 font-medium text-sm">
                Your email is not registered in the system
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Only authorized club members can access the SquadUp management system. 
                If you believe this is a mistake, please contact the club administrator.
              </p>
              
              <div className="flex items-center gap-2 justify-center text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>Contact your club administrator for access</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-6 border-t border-gray-200">
              <Button
                onClick={handleTryAgain}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-text-primary font-semibold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Different Account
              </Button>
              
              <p className="text-xs text-text-secondary">
                This will log you out and allow you to sign in with a different Google account
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
