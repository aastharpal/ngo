'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_TASKS, MOCK_PROJECTS } from '@/lib/mock-data';
import { Task, TaskStatus, TaskPriority, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckSquare, Plus, Clock, User, CheckCircle2, PlayCircle, Search, Sparkles } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [role, setRole] = useState<UserRole>('VOLUNTEER');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State for Admins/Coordinators
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(MOCK_PROJECTS[0]?.id || 'prj-101');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assignedTo, setAssignedTo] = useState('Priya Verma');
  const [deadline, setDeadline] = useState('');

  const updateRole = () => {
    const savedActiveView = localStorage.getItem('active_view') as UserRole;
    const savedRole = localStorage.getItem('user_role') as UserRole;
    const savedId = localStorage.getItem('user_id');
    const savedEmail = localStorage.getItem('user_email');
    setRole(savedActiveView || savedRole || 'VOLUNTEER');
    if (savedId) setUserId(savedId);
    if (savedEmail) setUserEmail(savedEmail);
  };

  useEffect(() => {
    updateRole();

    const handleRoleChange = () => {
      updateRole();
    };

    window.addEventListener('roleViewChanged', handleRoleChange);
    return () => window.removeEventListener('roleViewChanged', handleRoleChange);
  }, []);

  // Fetch real tasks from backend based on role
  useEffect(() => {
    async function loadTasks() {
      setIsLoading(true);
      try {
        if (role === 'VOLUNTEER') {
          if (!userId) {
            setTasks([]);
            return;
          }
          const res = await fetch(`http://localhost:5000/api/volunteers/${userId}/tasks`);
          if (res.ok) {
            const data = await res.json();
            setTasks(data);
          } else {
            setTasks([]);
          }
        } else {
          // Coordinators / NGO Admins see all tasks
          const res = await fetch('http://localhost:5000/api/tasks');
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              const mapped = data.map((t: any) => ({
                id: `tsk-${t.taskId}`,
                projectId: `prj-${t.projectId}`,
                title: t.title,
                description: t.description,
                priority: (t.priority || 'MEDIUM') as TaskPriority,
                deadline: t.dueDate || new Date().toISOString(),
                status: (t.status || 'PENDING') as TaskStatus,
                assignedTo: 'Active Volunteers',
              }));
              setTasks(mapped);
            } else {
              setTasks(MOCK_TASKS);
            }
          } else {
            setTasks(MOCK_TASKS);
          }
        }
      } catch (err) {
        // Safe fallback: zero fake tasks for non-demo volunteers
        if (role === 'VOLUNTEER') {
          setTasks([]);
        } else {
          setTasks(MOCK_TASKS);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadTasks();
  }, [role, userId]);

  const isVolunteer = role === 'VOLUNTEER';

  // Handle Task Status Change
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
            }
          : task
      )
    );
  };

  // Handle New Task Creation (Coordinators & Admins only)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    const newTask: Task = {
      id: `tsk-${Date.now()}`,
      projectId,
      title,
      description,
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : new Date().toISOString(),
      status: 'PENDING',
      assignedTo,
    };

    setTasks([newTask, ...tasks]);
    setIsDialogOpen(false);

    // Also persist to backend
    try {
      await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 5,
          title,
          description,
          priority,
          dueDate: deadline || new Date().toISOString(),
        }),
      });
    } catch (err) {
      // Background save
    }

    // Reset Form
    setTitle('');
    setDescription('');
    setDeadline('');
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-800 border-red-200">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Medium</Badge>;
      case 'LOW':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Low</Badge>;
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1"><PlayCircle className="h-3 w-3" /> In Progress</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <CheckSquare className="h-7 w-7 text-blue-600" />
            {isVolunteer ? 'My Assigned Volunteer Tasks' : 'Task Management & Allocations'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isVolunteer
              ? 'View tasks allocated to you by NGO project coordinators and track your active deliverables.'
              : 'Create deliverables, assign responsibilities to active volunteers, and monitor field execution.'}
          </p>
        </div>

        {/* Action Button: ONLY visible for Coordinators and NGO Admins */}
        {!isVolunteer && (
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 self-start sm:self-auto shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>

      {/* Task Cards Grid or Realistic Empty State */}
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const associatedProject = MOCK_PROJECTS.find((p) => p.id === task.projectId);

            return (
              <Card key={task.id} className="border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-500 truncate">
                      {associatedProject ? associatedProject.title : 'Impact Initiative'}
                    </span>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <CardTitle className="text-base font-bold text-gray-900">
                    {task.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 line-clamp-2 mt-1">
                    {task.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2 text-xs text-gray-600 py-2 border-t border-b border-gray-100 my-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Assigned To:</span>
                    <span className="font-semibold text-gray-800 flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-blue-600" />
                      {task.assignedTo || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Deadline:</span>
                    <span className="font-mono text-gray-700" suppressHydrationWarning>
                      {new Date(task.deadline).toLocaleDateString('en-US')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    {getStatusBadge(task.status)}
                  </div>
                </CardContent>

                {/* Status Update Actions */}
                <div className="p-4 pt-1 flex items-center justify-between gap-2">
                  {task.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                      className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      Start Working
                    </Button>
                  )}

                  {task.status === 'IN_PROGRESS' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                      className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                    >
                      Mark as Completed
                    </Button>
                  )}

                  {task.status === 'COMPLETED' && (
                    <div className="w-full py-1 text-center text-xs font-semibold text-green-700 bg-green-50 rounded border border-green-200 flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Deliverable Fulfilled
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State for Volunteers without Tasks */
        <Card className="border-gray-200 shadow-sm p-12 text-center space-y-4">
          <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-full mx-auto">
            <CheckSquare className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">No Assigned Tasks</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              You are not currently assigned to any project deliverables. When an NGO coordinator assigns field work to you, it will appear right here.
            </p>
          </div>
          <Link href="/projects">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm">
              <Search className="h-3.5 w-3.5" /> Explore Open Projects & Opportunities
            </Button>
          </Link>
        </Card>
      )}

      {/* Create Task Dialog (Protected: Only coordinators and admins) */}
      {!isVolunteer && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreateTask}>
              <DialogHeader>
                <DialogTitle>Create & Assign Deliverable Task</DialogTitle>
                <DialogDescription>
                  Allocate task duties to an active volunteer under your project.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="task-title" className="text-xs font-medium">Task Title</Label>
                  <Input
                    id="task-title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Conduct English Orientation"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="task-desc" className="text-xs font-medium">Description</Label>
                  <Input
                    id="task-desc"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide specific instructions for the volunteer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="priority" className="text-xs font-medium">Priority</Label>
                    <select
                      id="priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="deadline" className="text-xs font-medium">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assigned" className="text-xs font-medium">Assign To Volunteer</Label>
                  <Input
                    id="assigned"
                    required
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="e.g. Priya Verma"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Assign Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}