import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, RefreshCw } from 'lucide-react';

export const PendingApprovalPage: React.FC = () => {
  const { user, checkUserStatus, logout } = useAuth();

  useEffect(() => {
    // Check status every 5 seconds
    const interval = setInterval(() => {
      checkUserStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [checkUserStatus]);

  const handleRefresh = () => {
    checkUserStatus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="text-center max-w-md bg-card/95 backdrop-blur-sm shadow-xl border-0">
        <CardHeader>
          <div className="mx-auto mb-4 p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full w-16 h-16 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-amber-600">Under Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Hello <span className="font-semibold">{user?.name}</span>! Your {user?.role} account is being reviewed by the administration team.
            </p>
            <p className="text-muted-foreground">
              You will be able to access your dashboard once your account is approved. This usually takes a few minutes.
            </p>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>What happens next?</strong><br />
              Once approved, your dashboard will open automatically. No need to refresh or sign in again!
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Check Status Now
            </Button>
            
            <Button 
              onClick={logout}
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              Sign Out
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Having issues? Contact administration for assistance.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};