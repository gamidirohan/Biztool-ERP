"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Search, CheckCircle, Circle, Clock, AlertTriangle, Flag, Edit, Trash2 } from "lucide-react";

interface Employee {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  sort_order: number;
  assigned_to: string;
  assigned_user?: { first_name: string; last_name: string };
}

export function TaskManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    due_date: ""
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeTasks(selectedEmployee.user_id);
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[TaskManager] No authenticated user');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[TaskManager] Error fetching profile:', profileError);
        setError('Failed to load user profile');
        return;
      }

      if (!profile?.tenant_id) {
        console.log('[TaskManager] No tenant_id in profile');
        return;
      }

      console.log('[TaskManager] Fetching employees for tenant:', profile.tenant_id, 'User role:', profile.role);

      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, user_id, name, email')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (employeesError) {
        console.error('[TaskManager] Error fetching employees:', employeesError);
        setError(`Failed to load employees: ${employeesError.message}`);
        return;
      }

      console.log('[TaskManager] Fetched employees:', employeesData?.length || 0);

      if (employeesData) {
        // Add role information from user_profiles
        const employeesWithRoles = await Promise.all(
          employeesData.map(async (emp) => {
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('role')
              .eq('id', emp.user_id)
              .single();

            const rawName = emp.name?.trim() ?? '';
            const normalizedName = rawName.length > 0 ? rawName : emp.email;
            const [firstName, ...rest] = normalizedName.split(/\s+/).filter(Boolean);
            const lastName = rest.join(' ');

            return {
              ...emp,
              name: normalizedName,
              first_name: firstName || normalizedName,
              last_name: lastName,
              role: userProfile?.role || 'employee'
            };
          })
        );

        setEmployees(employeesWithRoles);
        console.log('[TaskManager] Employees with roles:', employeesWithRoles);
      }
    } catch (err) {
      console.error('[TaskManager] Exception loading employees:', err);
      setError('Failed to load employees');
    }
  };

  const loadEmployeeTasks = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks?assigned_to=${userId}`);
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

  const createTask = async () => {
    if (!selectedEmployee || !newTask.title.trim()) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim() || undefined,
          assigned_to: selectedEmployee.user_id,
          priority: newTask.priority,
          due_date: newTask.due_date || undefined,
          is_daily_task: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const data = await response.json();
      setTasks(prev => [...prev, data.task]);
      setNewTask({ title: "", description: "", priority: "medium", due_date: "" });
      setShowCreateDialog(false);
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Failed to create task');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
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
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task');
    }
  };

  const getEmployeeDisplayName = (employee: Employee) => {
    if (employee.name?.trim()) {
      return employee.name.trim();
    }

    const nameParts = [employee.first_name, employee.last_name].filter(Boolean).join(' ').trim();
    if (nameParts.length > 0) {
      return nameParts;
    }

    return employee.email;
  };

  const filteredEmployees = employees.filter((emp) => {
    const displayName = getEmployeeDisplayName(emp).toLowerCase();
    const search = searchTerm.toLowerCase();
    return displayName.includes(search) || emp.email.toLowerCase().includes(search);
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <Flag className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const pendingTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6" style={{ color: 'var(--primary)' }} />
        <h2 className="text-2xl font-bold text-[color:var(--foreground)]">Task Management</h2>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Employee Selection */}
      <Card className="border-[color:var(--border)]">
        <CardHeader>
          <CardTitle className="text-lg">Select Employee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--muted-foreground)]" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Employee List - Always Visible */}
          <div className="border border-[color:var(--card-border)] rounded-lg p-4 max-h-96 overflow-y-auto bg-[color:var(--background)]/30">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-[color:var(--muted-foreground)]">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No employees found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => setSelectedEmployee(employee)}
                    className={`w-full p-3 border rounded-lg text-left hover:bg-[color:var(--card-bg)]/60 transition-colors ${
                      selectedEmployee?.id === employee.id
                        ? 'border-[color:var(--primary)] bg-[color:var(--primary)]/5'
                        : 'border-[color:var(--card-border)]'
                    }`}
                  >
                    <div className="font-medium text-sm">
                      {employee.first_name} {employee.last_name}
                    </div>
                    <div className="text-xs text-[color:var(--muted-foreground)]">
                      {employee.email}
                    </div>
                    <div className="text-xs text-[color:var(--primary)] capitalize mt-1">
                      {employee.role}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedEmployee && (
            <div className="flex items-center justify-between pt-4 border-t border-[color:var(--card-border)]">
              <div>
                <p className="font-medium">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </p>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  {selectedEmployee.email}
                </p>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Task for {selectedEmployee.first_name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <Input
                        value={newTask.title}
                        onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Task title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <Textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Task description (optional)"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Priority</label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Due Date</label>
                        <Input
                          type="date"
                          value={newTask.due_date}
                          onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={createTask}
                        disabled={!newTask.title.trim()}
                        className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)]"
                      >
                        Create Task
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Display */}
      {selectedEmployee && (
        <Card className="border-[color:var(--border)]">
          <CardHeader>
            <CardTitle className="text-lg">
              Tasks for {selectedEmployee.first_name} {selectedEmployee.last_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Clock className="h-6 w-6 animate-spin" style={{ color: 'var(--primary)' }} />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-[color:var(--muted-foreground)]" />
                <p className="text-lg font-medium mb-2">No tasks yet</p>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Create the first task for this employee
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-[color:var(--foreground)]/70">
                      Pending ({pendingTasks.length})
                    </h3>
                    {pendingTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 border border-[color:var(--card-border)] rounded-lg">
                        <button
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="flex-shrink-0 hover:scale-110 transition-transform"
                        >
                          <Circle className="h-5 w-5 text-[color:var(--muted-foreground)] hover:text-green-500" />
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
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-[color:var(--foreground)]/70">
                      Completed ({completedTasks.length})
                    </h3>
                    {completedTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 border border-[color:var(--card-border)] rounded-lg bg-[color:var(--card-bg)]/50">
                        <button
                          onClick={() => updateTaskStatus(task.id, 'pending')}
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
                              {new Date(task.completed_at).toLocaleDateString()}
                            </span>
                          )}
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}