"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Plus, GripVertical, Clock, AlertTriangle, Flag } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  sort_order: number;
  assigned_user?: { first_name: string; last_name: string };
}

export function DailyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks?daily_only=true');
      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const data = await response.json();
      setTasks(prev => prev.map(task =>
        task.id === taskId ? data.task : task
      ));
    } catch (err) {
      console.error('Error updating task:', err);
      // Revert optimistic update on error
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: currentStatus as Task['status'] } : task
      ));
    }
  };

  const addNewTask = async () => {
    const title = prompt('Enter task title:');
    if (!title?.trim()) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          is_daily_task: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const data = await response.json();
      setTasks(prev => [...prev, data.task]);
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Failed to create task');
    }
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask === targetTaskId) return;

    const draggedTaskData = tasks.find(t => t.id === draggedTask);
    const targetTaskData = tasks.find(t => t.id === targetTaskId);

    if (!draggedTaskData || !targetTaskData) return;

    // Calculate new sort order
    const draggedIndex = tasks.findIndex(t => t.id === draggedTask);
    const targetIndex = tasks.findIndex(t => t.id === targetTaskId);

    let newSortOrder;
    if (draggedIndex < targetIndex) {
      // Moving down - place after target
      newSortOrder = targetTaskData.sort_order + 1;
    } else {
      // Moving up - place before target
      newSortOrder = targetTaskData.sort_order - 1;
    }

    try {
      const response = await fetch(`/api/tasks/${draggedTask}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: newSortOrder })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder task');
      }

      // Reload tasks to get correct order
      await loadTasks();
    } catch (err) {
      console.error('Error reordering task:', err);
    }

    setDraggedTask(null);
  };

  const pendingTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <Flag className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Clock className="h-6 w-6 animate-spin mx-auto mb-2" style={{ color: 'var(--primary)' }} />
          <p className="text-sm text-[color:var(--muted-foreground)]">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 mx-auto mb-4" style={{ color: 'var(--danger)' }} />
        <p className="text-sm text-[color:var(--muted-foreground)]">{error}</p>
        <Button onClick={loadTasks} variant="outline" size="sm" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tasks for Today</h2>
        <Button onClick={addNewTask} size="sm" className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)]">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {pendingTasks.length === 0 && completedTasks.length === 0 && (
        <div className="text-center py-12 border border-dashed border-[color:var(--card-border)] rounded-lg">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-[color:var(--muted-foreground)]" />
          <p className="text-lg font-medium mb-2">No tasks yet</p>
          <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
            Get started by adding your first task for today
          </p>
          <Button onClick={addNewTask} className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Task
          </Button>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[color:var(--foreground)]/70">To Do</h3>
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={() => handleDragStart(task.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, task.id)}
              className="flex items-center gap-3 p-3 border border-[color:var(--card-border)] rounded-lg bg-[color:var(--card-bg)] hover:shadow-sm transition-shadow cursor-move group"
            >
              <GripVertical className="h-4 w-4 text-[color:var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <button
                onClick={() => toggleTaskStatus(task.id, task.status)}
                className="flex-shrink-0 hover:scale-110 transition-transform"
              >
                <Circle className="h-5 w-5 text-[color:var(--muted-foreground)] hover:text-[color:var(--primary)]" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-[color:var(--muted-foreground)] mt-1">{task.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getPriorityIcon(task.priority)}
                {task.due_date && (
                  <span className="text-xs text-[color:var(--muted-foreground)]">
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[color:var(--foreground)]/70">Completed</h3>
          {completedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 border border-[color:var(--card-border)] rounded-lg bg-[color:var(--card-bg)]/50"
            >
              <button
                onClick={() => toggleTaskStatus(task.id, task.status)}
                className="flex-shrink-0 hover:scale-110 transition-transform"
              >
                <CheckCircle className="h-5 w-5 text-green-500" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm line-through text-[color:var(--muted-foreground)]">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-[color:var(--muted-foreground)] line-through mt-1">{task.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getPriorityIcon(task.priority)}
                {task.completed_at && (
                  <span className="text-xs text-[color:var(--muted-foreground)]">
                    {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}