import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { GraduationCap, BookOpen, Shield } from 'lucide-react';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const LoginForm: React.FC = () => {
  const { login, signup, loading } = useAuth();
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    registrationNumber: '',
    password: ''
  });
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [adminPassword, setAdminPassword] = useState('');

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignupMode) {
      const success = await signup(studentForm, 'student');
      if (success) {
        window.location.href = '/dashboard';
      }
    } else {
      const success = await login({ registrationNumber: studentForm.registrationNumber, password: studentForm.password }, 'student');
      if (success) {
        window.location.href = '/dashboard';
      }
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignupMode) {
      const success = await signup(teacherForm, 'teacher');
      if (success) {
        window.location.href = '/dashboard';
      }
    } else {
      const success = await login(teacherForm, 'teacher');
      if (success) {
        window.location.href = '/dashboard';
      }
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login({ password: adminPassword }, 'admin');
    if (success) {
      window.location.href = '/admin';
    }
  };

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            UCC STUDENT COMPLAINT SYSTEM
          </h1>
          <p className="text-muted-foreground mt-2">Welcome back! Please sign in to your account</p>
        </div>

        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">{isSignupMode ? 'Sign Up' : 'Sign In'}</CardTitle>
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => setIsSignupMode(!isSignupMode)}
                className="text-sm font-medium bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary animate-fade-in hover-scale"
              >
                {isSignupMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="teacher" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Staff
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student" className="space-y-4 mt-6">
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  {isSignupMode && (
                    <div className="space-y-2">
                      <Label htmlFor="student-name">Name</Label>
                      <Input
                        id="student-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={studentForm.name}
                        onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="registration-number">University Registration Number</Label>
                    <Input
                      id="registration-number"
                      type="text"
                      placeholder="Enter your registration number"
                      value={studentForm.registrationNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, registrationNumber: e.target.value })}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <Input
                      id="student-password"
                      type="password"
                      placeholder="Enter your password"
                      value={studentForm.password}
                      onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-student hover:bg-student/90 text-student-foreground"
                    disabled={loading}
                  >
                    {loading ? (isSignupMode ? 'Signing up...' : 'Signing in...') : (isSignupMode ? 'Sign Up as Student' : 'Sign In as Student')}
                  </Button>
                  
                  {!isSignupMode && (
                    <Button 
                      type="button" 
                      variant="link" 
                      className="w-full mt-2 text-sm text-muted-foreground hover:text-primary"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot Password?
                    </Button>
                  )}
                </form>
              </TabsContent>

              <TabsContent value="teacher" className="space-y-4 mt-6">
                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                  {isSignupMode && (
                    <div className="space-y-2">
                      <Label htmlFor="teacher-name">Name</Label>
                      <Input
                        id="teacher-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={teacherForm.name}
                        onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="teacher-email">Email</Label>
                    <Input
                      id="teacher-email"
                      type="email"
                      placeholder="Enter your email"
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-password">Password</Label>
                    <Input
                      id="teacher-password"
                      type="password"
                      placeholder="Enter your password"
                      value={teacherForm.password}
                      onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-teacher hover:bg-teacher/90 text-teacher-foreground"
                    disabled={loading}
                  >
                    {loading ? (isSignupMode ? 'Signing up...' : 'Signing in...') : (isSignupMode ? 'Sign Up as Staff' : 'Sign In as Staff')}
                  </Button>
                  
                  {!isSignupMode && (
                    <Button 
                      type="button" 
                      variant="link" 
                      className="w-full mt-2 text-sm text-muted-foreground hover:text-primary"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot Password?
                    </Button>
                  )}
                </form>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4 mt-6">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Administrator Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-admin hover:bg-admin/90 text-admin-foreground transform transition-all duration-200 hover:scale-105 active:scale-95 active:animate-pulse"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In as Administrator'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
