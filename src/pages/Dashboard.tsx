import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'student') {
    return <StudentDashboard />;
  }

  if (user.role === 'teacher') {
    return <TeacherDashboard />;
  }

  return null;
};

export default Dashboard;