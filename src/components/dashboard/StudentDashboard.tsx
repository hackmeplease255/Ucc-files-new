import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, MessageCircle, Trash2, ChevronDown, ChevronRight, Eye, Reply } from 'lucide-react';

interface Issue {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  is_read: boolean;
  read_count: number;
  issue_replies?: {
    id: number;
    content: string;
    author_id: number;
    author_type: string;
    created_at: string;
  }[];
}

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  useEffect(() => {
    fetchIssues();

    // Set up real-time subscription for issues updates
    const channel = supabase
      .channel('student-issues-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'issues',
          filter: `student_id=eq.${user?.id}`
        },
        () => {
          // Refetch issues when any issue is updated
          fetchIssues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchIssues = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        issue_replies (
          id,
          content,
          author_id,
          author_type,
          created_at
        )
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch your issues",
        variant: "destructive",
      });
    } else {
      setIssues(data || []);
    }
  };

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from('issues')
      .insert({
        student_id: user.id,
        title: formData.title,
        description: formData.description
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit issue",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Issue submitted successfully",
      });
      setFormData({ title: '', description: '' });
      setShowForm(false);
      fetchIssues();
    }
    setLoading(false);
  };

  const deleteIssue = async (issueId: number) => {
    setLoading(true);
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId)
      .eq('student_id', user?.id); // Extra security check

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete issue",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Issue deleted successfully",
      });
      fetchIssues();
    }
    setLoading(false);
  };

  const getStatusDisplay = (issue: Issue) => {
    const hasReplies = issue.issue_replies && issue.issue_replies.length > 0;
    if (hasReplies) {
      return 'Replied';
    } else if (issue.read_count === 0) {
      return 'Sent but Pending';
    } else if (issue.read_count === 1) {
      return 'Read 1';
    } else if (issue.read_count === 2) {
      return 'Read 2';
    } else {
      return `Read ${issue.read_count}`;
    }
  };

  const getStatusVariant = (issue: Issue) => {
    const hasReplies = issue.issue_replies && issue.issue_replies.length > 0;
    if (hasReplies) {
      return 'default';
    } else if (issue.read_count === 0) {
      return 'secondary';
    } else {
      return 'outline';
    }
  };

  const toggleIssueExpansion = (issueId: number) => {
    setExpandedIssue(expandedIssue === issueId ? null : issueId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-student/5 via-background to-accent/10">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
            <p className="text-muted-foreground">Student Dashboard</p>
          </div>
          <Button onClick={logout} variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Submit New Issue
                </CardTitle>
                <Button 
                  onClick={() => setShowForm(!showForm)}
                  className="bg-student hover:bg-student/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Issue
                </Button>
              </div>
            </CardHeader>
            {showForm && (
              <CardContent>
                <form onSubmit={handleSubmitIssue} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Issue Title</Label>
                    <Input
                      id="title"
                      placeholder="Brief description of your issue"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Issue Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide detailed information about your issue"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-student hover:bg-student/90"
                    >
                      {loading ? 'Submitting...' : 'Submit Issue'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Submitted Issues</CardTitle>
            </CardHeader>
            <CardContent>
              {issues.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No issues submitted yet. Click "New Issue" to get started.
                </p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {issues.map((issue) => (
                    <div key={issue.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-1 mr-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleIssueExpansion(issue.id)}
                            className="p-1 h-auto"
                          >
                            {expandedIssue === issue.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <h3 className="font-semibold break-words">{issue.title}</h3>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Badge variant={getStatusVariant(issue)}>
                            {getStatusDisplay(issue)}
                          </Badge>
                          {issue.issue_replies && issue.issue_replies.length > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <Reply className="h-3 w-3" />
                              {issue.issue_replies.length}
                            </Badge>
                          )}
                          <Button
                            onClick={() => deleteIssue(issue.id)}
                            disabled={loading}
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive p-1 h-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {expandedIssue === issue.id && (
                        <>
                          <div className="pl-6 space-y-3">
                            <div className="max-h-32 overflow-y-auto">
                              <p className="text-muted-foreground break-words whitespace-pre-wrap">{issue.description}</p>
                            </div>
                            
                            {issue.issue_replies && issue.issue_replies.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm">Teacher Responses:</h4>
                                {issue.issue_replies.map((reply) => (
                                  <div key={reply.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium">Teacher</span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(reply.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm break-words whitespace-pre-wrap">{reply.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Submitted: {new Date(issue.created_at).toLocaleDateString()}</span>
                        {issue.read_count > 0 && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{issue.read_count} teacher{issue.read_count !== 1 ? 's' : ''} viewed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};