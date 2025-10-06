import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface Student {
  id: number;
  name: string;
  university_registration_number: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AuthUser {
  id: number;
  name: string;
  role: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  email?: string;
  university_registration_number?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: any, role: UserRole) => Promise<boolean>;
  signup: (userData: any, role: UserRole) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  checkUserStatus: () => Promise<void>;
  resetPassword: (resetData: any, role: UserRole) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('auth-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: any, role: UserRole): Promise<boolean> => {
    try {
      setLoading(true);

      if (role === 'admin') {
        // Check admin credentials from database
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('username', credentials.username || 'admin')
          .single();

        if (adminError || !adminData) {
          toast({
            title: "Error",
            description: "Admin account not found",
            variant: "destructive",
          });
          return false;
        }

        if (adminData.password !== credentials.password) {
          toast({
            title: "Error",
            description: "Invalid admin password",
            variant: "destructive",
          });
          return false;
        }

        const adminUser: AuthUser = {
          id: adminData.id,
          name: 'Administrator',
          role: 'admin',
          status: 'approved'
        };
        setUser(adminUser);
        localStorage.setItem('auth-user', JSON.stringify(adminUser));
        return true;
      }

      if (role === 'student') {
        // First, check if user exists with this registration number
        const { data: existingStudent, error: checkError } = await supabase
          .from('students')
          .select('*')
          .eq('university_registration_number', credentials.registrationNumber)
          .maybeSingle();

        if (checkError) {
          toast({
            title: "Error",
            description: "Database error occurred",
            variant: "destructive",
          });
          return false;
        }

        if (!existingStudent) {
          toast({
            title: "Account Not Found",
            description: "No account found with this registration number. Please sign up first.",
            variant: "destructive",
          });
          return false;
        }

        // Check password
        if (existingStudent.password !== credentials.password) {
          toast({
            title: "Error",
            description: "Invalid password",
            variant: "destructive",
          });
          return false;
        }

        // Handle different statuses
        if (existingStudent.status === 'rejected') {
          toast({
            title: "Account Rejected",
            description: "Your account has been rejected by the administrator",
            variant: "destructive",
          });
          return false;
        }

        // For both pending and approved users, log them in and let ProtectedRoute handle the display
        const studentUser: AuthUser = {
          id: existingStudent.id,
          name: existingStudent.name,
          role: 'student',
          status: existingStudent.status as 'pending' | 'approved' | 'rejected',
          university_registration_number: existingStudent.university_registration_number
        };
        setUser(studentUser);
        localStorage.setItem('auth-user', JSON.stringify(studentUser));

        if (existingStudent.status === 'pending') {
          toast({
            title: "Account Under Review",
            description: "Your account is still pending approval.",
          });
        }

        return true;
      }

      if (role === 'teacher') {
        // First, check if user exists with this email
        const { data: existingTeacher, error: checkError } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', credentials.email)
          .maybeSingle();

        if (checkError) {
          toast({
            title: "Error",
            description: "Database error occurred",
            variant: "destructive",
          });
          return false;
        }

        if (!existingTeacher) {
          toast({
            title: "Account Not Found",
            description: "No account found with this email. Please sign up first.",
            variant: "destructive",
          });
          return false;
        }

        // Check password
        if (existingTeacher.password !== credentials.password) {
          toast({
            title: "Error",
            description: "Invalid password",
            variant: "destructive",
          });
          return false;
        }

        // Handle different statuses
        if (existingTeacher.status === 'rejected') {
          toast({
            title: "Account Rejected",
            description: "Your account has been rejected by the administrator",
            variant: "destructive",
          });
          return false;
        }

        // For both pending and approved users, log them in and let ProtectedRoute handle the display
        const teacherUser: AuthUser = {
          id: existingTeacher.id,
          name: existingTeacher.name,
          role: 'teacher',
          status: existingTeacher.status as 'pending' | 'approved' | 'rejected',
          email: existingTeacher.email
        };
        setUser(teacherUser);
        localStorage.setItem('auth-user', JSON.stringify(teacherUser));

        if (existingTeacher.status === 'pending') {
          toast({
            title: "Account Under Review",
            description: "Your account is still pending approval.",
          });
        }

        return true;
      }

      return false;
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: any, role: UserRole): Promise<boolean> => {
    try {
      setLoading(true);

      if (role === 'student') {
        const { data, error } = await supabase
          .from('students')
          .insert([{
            name: userData.name,
            university_registration_number: userData.registrationNumber,
            password: userData.password
          }])
          .select()
          .single();

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }

        const pendingUser: AuthUser = {
          id: data.id,
          name: data.name,
          role: 'student',
          status: 'pending' as 'pending' | 'approved' | 'rejected',
          university_registration_number: data.university_registration_number
        };
        setUser(pendingUser);
        localStorage.setItem('auth-user', JSON.stringify(pendingUser));
        toast({
          title: "Registration Successful",
          description: "Your account has been created and is under review by administration.",
        });
        return true;
      }

      if (role === 'teacher') {
        const { data, error } = await supabase
          .from('teachers')
          .insert([{
            name: userData.name,
            email: userData.email,
            password: userData.password
          }])
          .select()
          .single();

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }

        const pendingUser: AuthUser = {
          id: data.id,
          name: data.name,
          role: 'teacher',
          status: 'pending' as 'pending' | 'approved' | 'rejected',
          email: data.email
        };
        setUser(pendingUser);
        localStorage.setItem('auth-user', JSON.stringify(pendingUser));
        toast({
          title: "Registration Successful",
          description: "Your account has been created and is under review by administration.",
        });
        return true;
      }

      return false;
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during registration",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    if (!user || user.role === 'admin') return;

    try {
      if (user.role === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('status')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data && data.status !== user.status) {
          const updatedUser = { ...user, status: data.status as 'pending' | 'approved' | 'rejected' };
          setUser(updatedUser);
          localStorage.setItem('auth-user', JSON.stringify(updatedUser));
          
          if (data.status === 'approved') {
            toast({
              title: "Account Approved!",
              description: "Your account has been approved. Welcome to the platform!",
            });
          }
        }
      } else if (user.role === 'teacher') {
        const { data, error } = await supabase
          .from('teachers')
          .select('status')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data && data.status !== user.status) {
          const updatedUser = { ...user, status: data.status as 'pending' | 'approved' | 'rejected' };
          setUser(updatedUser);
          localStorage.setItem('auth-user', JSON.stringify(updatedUser));
          
          if (data.status === 'approved') {
            toast({
              title: "Account Approved!",
              description: "Your account has been approved. Welcome to the platform!",
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const resetPassword = async (resetData: any, role: UserRole): Promise<boolean> => {
    try {
      setLoading(true);

      if (role === 'student') {
        // First, verify the user exists with the provided registration number and name
        const { data: existingStudent, error: checkError } = await supabase
          .from('students')
          .select('*')
          .eq('university_registration_number', resetData.registrationNumber)
          .eq('name', resetData.name)
          .maybeSingle();

        if (checkError) {
          toast({
            title: "Error",
            description: "Database error occurred",
            variant: "destructive",
          });
          return false;
        }

        if (!existingStudent) {
          toast({
            title: "Invalid Details",
            description: "No account found with the provided registration number and name",
            variant: "destructive",
          });
          return false;
        }

        // Update the password
        const { error: updateError } = await supabase
          .from('students')
          .update({ password: resetData.newPassword })
          .eq('id', existingStudent.id);

        if (updateError) {
          toast({
            title: "Error",
            description: "Failed to update password",
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: "Password Reset Successful",
          description: "Your password has been updated successfully",
        });
        return true;
      }

      if (role === 'teacher') {
        // First, verify the user exists with the provided email and name
        const { data: existingTeacher, error: checkError } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', resetData.email)
          .eq('name', resetData.name)
          .maybeSingle();

        if (checkError) {
          toast({
            title: "Error",
            description: "Database error occurred",
            variant: "destructive",
          });
          return false;
        }

        if (!existingTeacher) {
          toast({
            title: "Invalid Details",
            description: "No account found with the provided email and name",
            variant: "destructive",
          });
          return false;
        }

        // Update the password
        const { error: updateError } = await supabase
          .from('teachers')
          .update({ password: resetData.newPassword })
          .eq('id', existingTeacher.id);

        if (updateError) {
          toast({
            title: "Error",
            description: "Failed to update password",
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: "Password Reset Successful",
          description: "Your password has been updated successfully",
        });
        return true;
      }

      return false;
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during password reset",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, checkUserStatus, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};