import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import Avatar from './Avatar';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CommentThread({ comments = [], onAddComment, className }) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    if (onAddComment) {
      onAddComment(newComment);
    }
    setNewComment('');
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 overflow-y-auto space-y-4 p-4 min-h-[300px]">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted text-sm font-sans">
            لا توجد تعليقات حتى الآن. كن أول من يكتب تعليقاً!
          </div>
        ) : (
          comments.map((comment, index) => (
            <div key={comment.id || index} className="flex gap-3">
              <Avatar src={comment.user?.avatar_url} alt={comment.user?.full_name} size="md" className="mt-1" />
              <div className="flex-1">
                <div className="bg-bg-elevated border border-border-default rounded-2xl rounded-tr-none p-3.5 shadow-sm text-sm">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-medium text-text-primary font-sans">{comment.user?.full_name || 'مستخدم'}</span>
                    <span className="text-xs text-text-muted font-mono" dir="ltr">{comment.created_at}</span>
                  </div>
                  <p className="text-text-secondary font-sans leading-relaxed whitespace-pre-wrap">
                    {comment.body}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border-default bg-bg-surface shrink-0 mt-auto">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input 
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="اكتب تعليقاً..."
            className="flex-1 bg-bg-base border-border-default h-11"
          />
          <Button type="submit" size="icon" className="h-11 w-11 bg-accent hover:bg-accent-hover text-white shrink-0">
            <Send className="w-5 h-5 ml-1" />
          </Button>
        </form>
      </div>
    </div>
  );
}
