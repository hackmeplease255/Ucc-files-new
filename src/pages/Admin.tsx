import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Users, UserCheck, CheckCircle2, UserX, MessageCircle, Download, AlertTriangle, Settings, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AdminPasswordChange } from '@/components/admin/AdminPasswordChange';

interface Student {
  id: number;
  name: string;
  university_registration_number: string;
  status: string;
  created_at: string;
}

interface Teacher {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

interface Issue {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  read_count: number;
  student_id: number;
  teacher_id?: number;
  students: {
    name: string;
    university_registration_number: string;
  };
  issue_replies?: {
    id: number;
    content: string;
    author_id: number;
    author_type: string;
    created_at: string;
  }[];
}

interface AdminTeacherMessage {
  id: number;
  admin_id: number;
  teacher_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const Admin: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [approvedStudents, setApprovedStudents] = useState<Student[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState<Teacher[]>([]);
  const [rejectedStudents, setRejectedStudents] = useState<Student[]>([]);
  const [rejectedTeachers, setRejectedTeachers] = useState<Teacher[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  const [selectedApprovedStudents, setSelectedApprovedStudents] = useState<number[]>([]);
  const [selectedApprovedTeachers, setSelectedApprovedTeachers] = useState<number[]>([]);
  const [selectedRejectedStudents, setSelectedRejectedStudents] = useState<number[]>([]);
  const [selectedRejectedTeachers, setSelectedRejectedTeachers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [teacherMessages, setTeacherMessages] = useState<AdminTeacherMessage[]>([]);
  const [messageText, setMessageText] = useState<{[key: number]: string}>({});
  const [openMessageDialog, setOpenMessageDialog] = useState<number | null>(null);
  const [teacherNamesMap, setTeacherNamesMap] = useState<{[key: number]: string}>({});
  const [replyTexts, setReplyTexts] = useState<{[key: number]: string}>({});
  const [showReplyForm, setShowReplyForm] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    fetchAllUsers();
    fetchIssues();
    fetchTeacherMessages();
    fetchTeacherNames();
  }, []);

  const fetchAllUsers = async () => {
    const [
      pendingStudentsResult, 
      pendingTeachersResult,
      approvedStudentsResult,
      approvedTeachersResult,
      rejectedStudentsResult,
      rejectedTeachersResult
    ] = await Promise.all([
      supabase.from('students').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('teachers').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('students').select('*').eq('status', 'approved').order('created_at', { ascending: false }),
      supabase.from('teachers').select('*').eq('status', 'approved').order('created_at', { ascending: false }),
      supabase.from('students').select('*').eq('status', 'rejected').order('created_at', { ascending: false }),
      supabase.from('teachers').select('*').eq('status', 'rejected').order('created_at', { ascending: false })
    ]);

    if (pendingStudentsResult.error) {
      toast({
        title: "Error",
        description: "Failed to fetch pending students",
        variant: "destructive",
      });
    } else {
      setStudents(pendingStudentsResult.data || []);
    }

    if (pendingTeachersResult.error) {
      toast({
        title: "Error",
        description: "Failed to fetch pending teachers",
        variant: "destructive",
      });
    } else {
      setTeachers(pendingTeachersResult.data || []);
    }

    if (approvedStudentsResult.error) {
      toast({
        title: "Error",
        description: "Failed to fetch approved students",
        variant: "destructive",
      });
    } else {
      setApprovedStudents(approvedStudentsResult.data || []);
    }

    if (approvedTeachersResult.error) {
      toast({
        title: "Error",
        description: "Failed to fetch approved teachers",
        variant: "destructive",
      });
    } else {
      setApprovedTeachers(approvedTeachersResult.data || []);
    }

    if (rejectedStudentsResult.error) {
      toast({
        title: "Error",
        description: "Failed to fetch rejected students",
        variant: "destructive",
      });
    } else {
      setRejectedStudents(rejectedStudentsResult.data || []);
    }

    if (rejectedTeachersResult.error) {
      toast({
        title: "Error",
        description: "Failed to fetch rejected teachers",
        variant: "destructive",
      });
    } else {
      setRejectedTeachers(rejectedTeachersResult.data || []);
    }
  };

  const approveUsers = async (userIds: number[], userType: 'students' | 'teachers') => {
    setLoading(true);
    const { error } = await supabase
      .from(userType)
      .update({ status: 'approved' })
      .in('id', userIds);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to approve ${userType}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Successfully approved ${userIds.length} ${userType}`,
      });
      
      if (userType === 'students') {
        setSelectedStudents([]);
      } else {
        setSelectedTeachers([]);
      }
      
      fetchAllUsers();
    }
    setLoading(false);
  };

  const rejectUsers = async (userIds: number[], userType: 'students' | 'teachers') => {
    setLoading(true);
    const { error } = await supabase
      .from(userType)
      .update({ status: 'rejected' })
      .in('id', userIds);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to reject ${userType}: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Successfully rejected ${userIds.length} ${userType}`,
      });
      
      if (userType === 'students') {
        setSelectedStudents([]);
      } else {
        setSelectedTeachers([]);
      }
      
      fetchAllUsers();
    }
    setLoading(false);
  };

  const approveAllStudents = () => {
    const allStudentIds = students.map(s => s.id);
    if (allStudentIds.length > 0) {
      approveUsers(allStudentIds, 'students');
    }
  };

  const approveAllTeachers = () => {
    const allTeacherIds = teachers.map(t => t.id);
    if (allTeacherIds.length > 0) {
      approveUsers(allTeacherIds, 'teachers');
    }
  };

  const approveSelectedStudents = () => {
    if (selectedStudents.length > 0) {
      approveUsers(selectedStudents, 'students');
    }
  };

  const approveSelectedTeachers = () => {
    if (selectedTeachers.length > 0) {
      approveUsers(selectedTeachers, 'teachers');
    }
  };

  const rejectSelectedStudents = () => {
    if (selectedStudents.length > 0) {
      rejectUsers(selectedStudents, 'students');
    }
  };

  const rejectSelectedTeachers = () => {
    if (selectedTeachers.length > 0) {
      rejectUsers(selectedTeachers, 'teachers');
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleTeacherSelection = (teacherId: number) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const toggleApprovedStudentSelection = (studentId: number) => {
    setSelectedApprovedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleApprovedTeacherSelection = (teacherId: number) => {
    setSelectedApprovedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const toggleRejectedStudentSelection = (studentId: number) => {
    setSelectedRejectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleRejectedTeacherSelection = (teacherId: number) => {
    setSelectedRejectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const unapproveUsers = async (userIds: number[], userType: 'students' | 'teachers') => {
    setLoading(true);
    const { error } = await supabase
      .from(userType)
      .update({ status: 'pending' })
      .in('id', userIds);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to unapprove ${userType}: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Successfully unapproved ${userIds.length} ${userType}`,
      });
      
      if (userType === 'students') {
        setSelectedApprovedStudents([]);
      } else {
        setSelectedApprovedTeachers([]);
      }
      
      fetchAllUsers();
    }
    setLoading(false);
  };

  const reapproveUsers = async (userIds: number[], userType: 'students' | 'teachers') => {
    setLoading(true);
    const { error } = await supabase
      .from(userType)
      .update({ status: 'approved' })
      .in('id', userIds);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to reapprove ${userType}: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Successfully reapproved ${userIds.length} ${userType}`,
      });
      
      if (userType === 'students') {
        setSelectedRejectedStudents([]);
      } else {
        setSelectedRejectedTeachers([]);
      }
      
      fetchAllUsers();
    }
    setLoading(false);
  };

  const fetchIssues = async () => {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        students (
          name,
          university_registration_number
        ),
        issue_replies (
          id,
          content,
          author_id,
          author_type,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch issues",
        variant: "destructive",
      });
    } else {
      setIssues(data || []);
    }
  };

  const generateReport = () => {
    const reportData = {
      totalStudents: approvedStudents.length,
      totalTeachers: approvedTeachers.length,
      pendingStudents: students.length,
      pendingTeachers: teachers.length,
      totalIssues: issues.length,
      unresolvedIssues: issues.filter(issue => !issue.issue_replies || issue.issue_replies.length === 0).length,
      resolvedIssues: issues.filter(issue => issue.issue_replies && issue.issue_replies.length > 0).length,
      timestamp: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `admin_report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    toast({
      title: "Report Generated",
      description: "Admin report has been downloaded",
    });
  };

  const toggleIssueExpansion = (issueId: number) => {
    setExpandedIssue(expandedIssue === issueId ? null : issueId);
  };

  const fetchTeacherMessages = async () => {
    const { data, error } = await supabase
      .from('admin_teacher_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch teacher messages",
        variant: "destructive",
      });
    } else {
      setTeacherMessages(data || []);
    }
  };

  const sendMessageToTeacher = async (teacherId: number) => {
    if (!user || !messageText[teacherId]?.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('admin_teacher_messages')
      .insert({
        admin_id: user.id,
        teacher_id: teacherId,
        message: messageText[teacherId].trim()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Message sent to teacher successfully",
      });
      setMessageText({ ...messageText, [teacherId]: '' });
      setOpenMessageDialog(null);
      fetchTeacherMessages();
    }
    setLoading(false);
  };

  const getTeacherMessageCount = (teacherId: number) => {
    return teacherMessages.filter(m => m.teacher_id === teacherId).length;
  };

  const fetchTeacherNames = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('id, name');

    if (error) {
      console.error('Error fetching teacher names:', error);
    } else if (data) {
      const namesMap = data.reduce((acc, teacher) => {
        acc[teacher.id] = teacher.name;
        return acc;
      }, {} as {[key: number]: string});
      setTeacherNamesMap(namesMap);
    }
  };

  const handleReplyToIssue = async (issueId: number) => {
    if (!user || !replyTexts[issueId]?.trim()) return;

    setLoading(true);
    
    // Insert reply to issue_replies so both students and staff can see it
    const { error: replyError } = await supabase
      .from('issue_replies')
      .insert({
        issue_id: issueId,
        content: replyTexts[issueId].trim(),
        author_id: user.id,
        author_type: 'admin'
      });

    if (replyError) {
      toast({
        title: "Error",
        description: "Failed to submit reply",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Success",
      description: "Reply submitted successfully",
    });
    setReplyTexts({ ...replyTexts, [issueId]: '' });
    setShowReplyForm({ ...showReplyForm, [issueId]: false });
    fetchIssues();
    setLoading(false);
  };

  const unapproveSelectedStudents = () => {
    if (selectedApprovedStudents.length > 0) {
      unapproveUsers(selectedApprovedStudents, 'students');
    }
  };

  const unapproveSelectedTeachers = () => {
    if (selectedApprovedTeachers.length > 0) {
      unapproveUsers(selectedApprovedTeachers, 'teachers');
    }
  };

  const reapproveSelectedStudents = () => {
    if (selectedRejectedStudents.length > 0) {
      reapproveUsers(selectedRejectedStudents, 'students');
    }
  };

  const reapproveSelectedTeachers = () => {
    if (selectedRejectedTeachers.length > 0) {
      reapproveUsers(selectedRejectedTeachers, 'teachers');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">Administrator access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-admin/5 via-background to-accent/10">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Administrator Dashboard</h1>
            <p className="text-muted-foreground">Manage user approvals</p>
          </div>
          <Button onClick={logout} variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-6 gap-1 mb-6 p-1">
            <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 py-1.5">Pending</TabsTrigger>
            <TabsTrigger value="approved" className="text-xs sm:text-sm px-2 py-1.5">Approved</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs sm:text-sm px-2 py-1.5">Rejected</TabsTrigger>
            <TabsTrigger value="issues" className="text-xs sm:text-sm px-2 py-1.5">Issues</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm px-2 py-1.5">Reports</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 py-1.5">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="grid lg:grid-cols-2 gap-6">
          {/* Students Section */}
          <Card>
             <CardHeader>
               <div className="flex justify-between items-start gap-4">
                 <CardTitle className="flex items-center gap-2">
                   <Users className="h-5 w-5" />
                   Pending Students ({students.length})
                 </CardTitle>
                 <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                   {selectedStudents.length > 0 && (
                     <>
                       <Button
                         onClick={approveSelectedStudents}
                         disabled={loading}
                         size="sm"
                         className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                       >
                         Approve Selected ({selectedStudents.length})
                       </Button>
                       <Button
                         onClick={rejectSelectedStudents}
                         disabled={loading}
                         size="sm"
                         variant="destructive"
                         className="text-xs px-2 py-1"
                       >
                         Reject Selected ({selectedStudents.length})
                       </Button>
                     </>
                   )}
                   {students.length > 0 && (
                     <Button
                       onClick={approveAllStudents}
                       disabled={loading}
                       size="sm"
                       variant="outline"
                       className="text-xs px-2 py-1 whitespace-nowrap"
                     >
                       <CheckCircle2 className="h-3 w-3 mr-1" />
                       Approve All
                     </Button>
                   )}
                 </div>
               </div>
             </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No pending student approvals.
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudentSelection(student.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.university_registration_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested: {new Date(student.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">{student.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teachers Section */}
          <Card>
             <CardHeader>
               <div className="flex justify-between items-start gap-4">
                 <CardTitle className="flex items-center gap-2">
                   <UserCheck className="h-5 w-5" />
                   Pending Teachers ({teachers.length})
                 </CardTitle>
                 <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                   {selectedTeachers.length > 0 && (
                     <>
                       <Button
                         onClick={approveSelectedTeachers}
                         disabled={loading}
                         size="sm"
                         className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                       >
                         Approve Selected ({selectedTeachers.length})
                       </Button>
                       <Button
                         onClick={rejectSelectedTeachers}
                         disabled={loading}
                         size="sm"
                         variant="destructive"
                         className="text-xs px-2 py-1"
                       >
                         Reject Selected ({selectedTeachers.length})
                       </Button>
                     </>
                   )}
                   {teachers.length > 0 && (
                     <Button
                       onClick={approveAllTeachers}
                       disabled={loading}
                       size="sm"
                       variant="outline"
                       className="text-xs px-2 py-1 whitespace-nowrap"
                     >
                       <CheckCircle2 className="h-3 w-3 mr-1" />
                       Approve All
                     </Button>
                   )}
                 </div>
               </div>
             </CardHeader>
            <CardContent>
              {teachers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No pending teacher approvals.
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedTeachers.includes(teacher.id)}
                        onCheckedChange={() => toggleTeacherSelection(teacher.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{teacher.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {teacher.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested: {new Date(teacher.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">{teacher.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          </TabsContent>

          <TabsContent value="approved">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Approved Students Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Approved Students ({approvedStudents.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      {selectedApprovedStudents.length > 0 && (
                        <Button
                          onClick={unapproveSelectedStudents}
                          disabled={loading}
                          size="sm"
                          variant="destructive"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Unapprove Selected ({selectedApprovedStudents.length})
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {approvedStudents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No approved students yet.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {approvedStudents.map((student) => (
                        <div key={student.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={selectedApprovedStudents.includes(student.id)}
                            onCheckedChange={() => toggleApprovedStudentSelection(student.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.university_registration_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Approved: {new Date(student.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="default" className="bg-green-600 text-white">
                            {student.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Approved Teachers Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Approved Teachers ({approvedTeachers.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      {selectedApprovedTeachers.length > 0 && (
                        <Button
                          onClick={unapproveSelectedTeachers}
                          disabled={loading}
                          size="sm"
                          variant="destructive"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Unapprove Selected ({selectedApprovedTeachers.length})
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {approvedTeachers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No approved teachers yet.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {approvedTeachers.map((teacher) => (
                        <div key={teacher.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={selectedApprovedTeachers.includes(teacher.id)}
                            onCheckedChange={() => toggleApprovedTeacherSelection(teacher.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{teacher.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {teacher.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Approved: {new Date(teacher.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="default" className="bg-green-600 text-white">
                            {teacher.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rejected">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Rejected Students Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Rejected Students ({rejectedStudents.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      {selectedRejectedStudents.length > 0 && (
                        <Button
                          onClick={reapproveSelectedStudents}
                          disabled={loading}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Reapprove Selected ({selectedRejectedStudents.length})
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {rejectedStudents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No rejected students.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {rejectedStudents.map((student) => (
                        <div key={student.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={selectedRejectedStudents.includes(student.id)}
                            onCheckedChange={() => toggleRejectedStudentSelection(student.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.university_registration_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Rejected: {new Date(student.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            {student.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Rejected Teachers Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Rejected Teachers ({rejectedTeachers.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      {selectedRejectedTeachers.length > 0 && (
                        <Button
                          onClick={reapproveSelectedTeachers}
                          disabled={loading}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Reapprove Selected ({selectedRejectedTeachers.length})
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {rejectedTeachers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No rejected teachers.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {rejectedTeachers.map((teacher) => (
                        <div key={teacher.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={selectedRejectedTeachers.includes(teacher.id)}
                            onCheckedChange={() => toggleRejectedTeacherSelection(teacher.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{teacher.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {teacher.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Rejected: {new Date(teacher.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            {teacher.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Student Issues Monitor ({issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {issues.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No issues submitted yet.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {issues.map((issue) => (
                      <div key={issue.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 mr-4">
                            <h3 className="font-semibold break-words">{issue.title}</h3>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Student: {issue.students.name}</p>
                              <p>Registration: {issue.students.university_registration_number}</p>
                              <p>Submitted: {new Date(issue.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 flex-wrap">
                            <Badge variant="outline" className="text-xs break-words max-w-full">
                              {issue.category}
                            </Badge>
                            <Badge variant={issue.read_count === 0 ? "destructive" : "secondary"}>
                              {issue.read_count === 0 ? "Unread" : `Read by ${issue.read_count}`}
                            </Badge>
                            {issue.issue_replies && issue.issue_replies.length > 0 ? (
                              <Badge variant="default">Replied</Badge>
                            ) : (
                              <Badge variant="outline">No Reply</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="max-h-32 overflow-y-auto">
                          <p className="text-muted-foreground break-words whitespace-pre-wrap">{issue.description}</p>
                        </div>

                        {issue.issue_replies && issue.issue_replies.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Responses:</h4>
                            {issue.issue_replies.map((reply) => (
                              <div key={reply.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">
                                        {reply.author_type === 'admin' 
                                          ? 'Admin'
                                          : reply.author_type === 'teacher' 
                                            ? teacherNamesMap[reply.author_id] || 'Staff' 
                                            : 'Staff'}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(reply.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm break-words whitespace-pre-wrap">{reply.content}</p>
                                  </div>
                                  {reply.author_type === 'teacher' && (
                                    <Dialog open={openMessageDialog === reply.author_id} onOpenChange={(open) => setOpenMessageDialog(open ? reply.author_id : null)}>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="gap-2 flex-shrink-0">
                                          <Send className="h-3 w-3" />
                                          Message
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Send Message to {teacherNamesMap[reply.author_id] || 'Staff'}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <Textarea
                                            placeholder="Type your message to the staff member..."
                                            value={messageText[reply.author_id] || ''}
                                            onChange={(e) => setMessageText({ ...messageText, [reply.author_id]: e.target.value })}
                                            rows={5}
                                          />
                                          <div className="flex gap-2 justify-end">
                                            <Button
                                              variant="outline"
                                              onClick={() => setOpenMessageDialog(null)}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              onClick={() => sendMessageToTeacher(reply.author_id)}
                                              disabled={loading || !messageText[reply.author_id]?.trim()}
                                              className="gap-2"
                                            >
                                              <Send className="h-4 w-4" />
                                              Send Message
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Admin Reply Form */}
                        <div className="pt-3 border-t">
                          {!showReplyForm[issue.id] ? (
                            <Button
                              onClick={() => setShowReplyForm({ ...showReplyForm, [issue.id]: true })}
                              size="sm"
                              className="gap-2"
                              variant="outline"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Reply as Admin
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <Label htmlFor={`reply-${issue.id}`}>Your Reply</Label>
                              <Textarea
                                id={`reply-${issue.id}`}
                                placeholder="Type your reply to the student..."
                                value={replyTexts[issue.id] || ''}
                                onChange={(e) => setReplyTexts({ ...replyTexts, [issue.id]: e.target.value })}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleReplyToIssue(issue.id)}
                                  disabled={loading || !replyTexts[issue.id]?.trim()}
                                  size="sm"
                                  className="gap-2"
                                >
                                  <Send className="h-4 w-4" />
                                  Send Reply
                                </Button>
                                <Button
                                  onClick={() => {
                                    setShowReplyForm({ ...showReplyForm, [issue.id]: false });
                                    setReplyTexts({ ...replyTexts, [issue.id]: '' });
                                  }}
                                  size="sm"
                                  variant="outline"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    System Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{approvedStudents.length}</div>
                      <div className="text-sm text-muted-foreground">Active Students</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-secondary">{approvedTeachers.length}</div>
                      <div className="text-sm text-muted-foreground">Active Teachers</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-accent">{issues.length}</div>
                      <div className="text-sm text-muted-foreground">Total Issues</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-destructive">
                        {issues.filter(issue => !issue.issue_replies || issue.issue_replies.length === 0).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Unresolved Issues</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button 
                      onClick={generateReport}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download System Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Issue Management Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Pending Approvals (Students)</span>
                      <Badge variant={students.length > 0 ? "destructive" : "secondary"}>
                        {students.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pending Approvals (Teachers)</span>
                      <Badge variant={teachers.length > 0 ? "destructive" : "secondary"}>
                        {teachers.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Unread Issues</span>
                      <Badge variant={issues.filter(i => i.read_count === 0).length > 0 ? "destructive" : "secondary"}>
                        {issues.filter(i => i.read_count === 0).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Unanswered Issues</span>
                      <Badge variant={issues.filter(i => !i.issue_replies || i.issue_replies.length === 0).length > 0 ? "destructive" : "secondary"}>
                        {issues.filter(i => !i.issue_replies || i.issue_replies.length === 0).length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Administrator Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminPasswordChange />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;