import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogOut, MessageCircle, Eye, Send, ThumbsUp, AlertCircle, CheckCircle, MessageSquare, Reply } from 'lucide-react';

interface Issue {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  is_read: boolean;
  read_count: number;
  student_id: number;
  issue_replies?: {
    id: number;
    content: string;
    author_id: number;
    author_type: string;
    created_at: string;
  }[];
  issue_reactions?: {
    id: number;
    user_id: number;
    user_type: string;
    reaction_type: string;
    created_at: string;
  }[];
}

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [unreadIssues, setUnreadIssues] = useState<Issue[]>([]);
  const [readIssues, setReadIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyTexts, setReplyTexts] = useState<{[key: number]: string}>({});
  const [showReplyForm, setShowReplyForm] = useState<{[key: number]: boolean}>({});
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  useEffect(() => {
    fetchIssues();
  }, []);

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
        ),
        issues_reactions (
          id,
          user_id,
          user_type,
          reaction_type,
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
      const issues = data || [];
      setAllIssues(issues);
      
      // Get issues read by this specific teacher
      const { data: teacherReads } = await supabase
        .from('issue_reads')
        .select('issue_id')
        .eq('teacher_id', user.id);

      const readByTeacher = new Set(teacherReads?.map(read => read.issue_id) || []);
      
      setUnreadIssues(issues.filter(issue => !readByTeacher.has(issue.id)));
      setReadIssues(issues.filter(issue => readByTeacher.has(issue.id)));
    }
  };

  const markAsRead = async (issueId: number) => {
    if (!user) return;

    setLoading(true);
    
    // Check if teacher has already read this issue
    const { data: existingRead } = await supabase
      .from('issue_reads')
      .select('id')
      .eq('issue_id', issueId)
      .eq('teacher_id', user.id)
      .single();

    if (existingRead) {
      toast({
        title: "Already Read",
        description: "You have already marked this issue as read",
      });
      setLoading(false);
      return;
    }

    // Move issue from unread to read for this teacher only
    const issueToMove = unreadIssues.find(issue => issue.id === issueId);
    if (issueToMove) {
      setUnreadIssues(prev => prev.filter(issue => issue.id !== issueId));
      setReadIssues(prev => [issueToMove, ...prev]);
    }

    const { error } = await supabase
      .from('issue_reads')
      .insert({ 
        issue_id: issueId,
        teacher_id: user.id 
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to mark issue as read",
        variant: "destructive",
      });
      // Revert the UI change
      if (issueToMove) {
        setReadIssues(prev => prev.filter(issue => issue.id !== issueId));
        setUnreadIssues(prev => [issueToMove, ...prev]);
      }
    } else {
      toast({
        title: "Success",
        description: "Issue marked as read",
      });
    }
    setLoading(false);
  };

  const sendReply = async (issueId: number) => {
    if (!user || !replyTexts[issueId]?.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('issue_replies')
      .insert({
        issue_id: issueId,
        author_id: user.id,
        author_type: 'teacher',
        content: replyTexts[issueId].trim()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
      setReplyTexts({ ...replyTexts, [issueId]: '' });
      setShowReplyForm({ ...showReplyForm, [issueId]: false });
      fetchIssues();
    }
    setLoading(false);
  };

  const addReaction = async (issueId: number, reactionType: string) => {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from('issues_reactions')
      .insert({
        issue_id: issueId,
        user_id: user.id,
        user_type: 'teacher',
        reaction_type: reactionType
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Reaction added",
      });
      fetchIssues();
    }
    setLoading(false);
  };

  const toggleReplyForm = (issueId: number) => {
    setShowReplyForm(prev => ({ ...prev, [issueId]: !prev[issueId] }));
  };

  const toggleIssueExpansion = (issueId: number) => {
    setExpandedIssue(expandedIssue === issueId ? null : issueId);
  };

  const getReactionIcon = (type: string) => {
    switch (type) {
      case 'like': return <ThumbsUp className="h-4 w-4" />;
      case 'important': return <AlertCircle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      default: return null;
    }
  };

  const renderIssueCard = (issue: Issue) => (
    <div key={issue.id} className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="font-semibold break-words">{issue.title}</h3>
          <p className="text-sm text-muted-foreground">
            Student ID: {issue.student_id} • {new Date(issue.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Badge variant={issue.read_count === 0 ? "destructive" : "secondary"}>
            {issue.read_count === 0 ? "Unread" : `Read by ${issue.read_count}`}
          </Badge>
        </div>
      </div>
      
      <div className="max-h-32 overflow-y-auto">
        <p className="text-muted-foreground break-words whitespace-pre-wrap">{issue.description}</p>
      </div>

      {/* Reactions */}
      {issue.issue_reactions && issue.issue_reactions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {issue.issue_reactions.map((reaction) => (
            <Badge key={reaction.id} variant="outline" className="gap-1">
              {getReactionIcon(reaction.reaction_type)}
              <span className="text-xs">Teacher</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Replies */}
      {issue.issue_replies && issue.issue_replies.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Replies:</h4>
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

      <div className="flex justify-between items-center gap-2">
        <div className="flex gap-2">
          <Button
            onClick={() => markAsRead(issue.id)}
            disabled={loading}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Mark Read
          </Button>
          <Button
            onClick={() => toggleReplyForm(issue.id)}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Reply className="h-4 w-4" />
            Reply
          </Button>
        </div>
        
        <div className="flex gap-1">
          <Button
            onClick={() => addReaction(issue.id, 'like')}
            disabled={loading}
            size="sm"
            variant="ghost"
            className="p-2"
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => addReaction(issue.id, 'important')}
            disabled={loading}
            size="sm"
            variant="ghost"
            className="p-2"
          >
            <AlertCircle className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => addReaction(issue.id, 'resolved')}
            disabled={loading}
            size="sm"
            variant="ghost"
            className="p-2"
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm[issue.id] && (
        <div className="space-y-3 border-t pt-3">
          <Label htmlFor={`reply-${issue.id}`}>Your Reply</Label>
          <Textarea
            id={`reply-${issue.id}`}
            placeholder="Type your response to the student..."
            value={replyTexts[issue.id] || ''}
            onChange={(e) => setReplyTexts({ ...replyTexts, [issue.id]: e.target.value })}
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => sendReply(issue.id)}
              disabled={loading || !replyTexts[issue.id]?.trim()}
              size="sm"
              className="bg-teacher hover:bg-teacher/90 gap-2"
            >
              <Send className="h-4 w-4" />
              Send Reply
            </Button>
            <Button
              onClick={() => toggleReplyForm(issue.id)}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teacher/5 via-background to-accent/10">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
            <p className="text-muted-foreground">Teacher Dashboard</p>
          </div>
          <Button onClick={logout} variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="unread">Unread ({unreadIssues.length})</TabsTrigger>
            <TabsTrigger value="read">Read ({readIssues.length})</TabsTrigger>
            <TabsTrigger value="all">All Issues ({allIssues.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="unread">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  New Student Issues ({unreadIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unreadIssues.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No unread issues at the moment.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {unreadIssues.map(renderIssueCard)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="read">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Read Issues ({readIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {readIssues.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No read issues yet.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {readIssues.map(renderIssueCard)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  All Student Issues ({allIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allIssues.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No issues submitted yet.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {allIssues.map(renderIssueCard)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
