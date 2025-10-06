import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [studentData, setStudentData] = useState({
    registrationNumber: '',
    name: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [teacherData, setTeacherData] = useState({
    email: '',
    name: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentData.newPassword !== studentData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (studentData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    const success = await resetPassword({
      registrationNumber: studentData.registrationNumber,
      name: studentData.name,
      newPassword: studentData.newPassword
    }, 'student');
    
    if (success) {
      onBack();
    }
    setLoading(false);
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherData.newPassword !== teacherData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (teacherData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    const success = await resetPassword({
      email: teacherData.email,
      name: teacherData.name,
      newPassword: teacherData.newPassword
    }, 'teacher');
    
    if (success) {
      onBack();
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your details to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="teacher">Teacher</TabsTrigger>
          </TabsList>
          
          <TabsContent value="student">
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <Label htmlFor="student-registration">University Registration Number</Label>
                <Input
                  id="student-registration"
                  type="text"
                  value={studentData.registrationNumber}
                  onChange={(e) => setStudentData({ ...studentData, registrationNumber: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="student-name">Full Name</Label>
                <Input
                  id="student-name"
                  type="text"
                  value={studentData.name}
                  onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="student-new-password">New Password</Label>
                <Input
                  id="student-new-password"
                  type="password"
                  value={studentData.newPassword}
                  onChange={(e) => setStudentData({ ...studentData, newPassword: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="student-confirm-password">Confirm New Password</Label>
                <Input
                  id="student-confirm-password"
                  type="password"
                  value={studentData.confirmPassword}
                  onChange={(e) => setStudentData({ ...studentData, confirmPassword: e.target.value })}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="teacher">
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <Label htmlFor="teacher-email">Email</Label>
                <Input
                  id="teacher-email"
                  type="email"
                  value={teacherData.email}
                  onChange={(e) => setTeacherData({ ...teacherData, email: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="teacher-name">Full Name</Label>
                <Input
                  id="teacher-name"
                  type="text"
                  value={teacherData.name}
                  onChange={(e) => setTeacherData({ ...teacherData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="teacher-new-password">New Password</Label>
                <Input
                  id="teacher-new-password"
                  type="password"
                  value={teacherData.newPassword}
                  onChange={(e) => setTeacherData({ ...teacherData, newPassword: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="teacher-confirm-password">Confirm New Password</Label>
                <Input
                  id="teacher-confirm-password"
                  type="password"
                  value={teacherData.confirmPassword}
                  onChange={(e) => setTeacherData({ ...teacherData, confirmPassword: e.target.value })}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};