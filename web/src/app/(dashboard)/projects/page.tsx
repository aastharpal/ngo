'use client';

import { useState, useEffect } from 'react';
import { MOCK_PROJECTS } from '@/lib/mock-data';
import { Project, ProjectStatus, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { FolderKanban, Plus, MapPin, Calendar, Users, Wrench, Send, CheckCircle2 } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [role, setRole] = useState<UserRole>('VOLUNTEER');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [appliedProjects, setAppliedProjects] = useState<Record<string, boolean>>({});

  // Form State for Admins/Coordinators
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Healthcare');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [requiredVolunteers, setRequiredVolunteers] = useState('10');
  const [skillsInput, setSkillsInput] = useState('');

  const updateRole = () => {
    const savedActiveView = localStorage.getItem('active_view') as UserRole;
    const savedRole = localStorage.getItem('user_role') as UserRole;
    setRole(savedActiveView || savedRole || 'VOLUNTEER');
  };

  useEffect(() => {
    updateRole();

    const handleRoleChange = () => {
      updateRole();
    };

    window.addEventListener('roleViewChanged', handleRoleChange);
    return () => window.removeEventListener('roleViewChanged', handleRoleChange);
  }, []);

  const isVolunteer = role === 'VOLUNTEER';

  // Volunteer Apply Handler
  const handleApply = async (projectId: string) => {
    setAppliedProjects((prev) => ({ ...prev, [projectId]: true }));

    const savedId = localStorage.getItem('user_id');
    if (!savedId) return;

    const numericId = parseInt(projectId.replace('prj-', ''), 10) || 5;

    try {
      await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(savedId, 10),
          projectId: numericId,
        }),
      });
    } catch (err) {
      // Fallback
    }
  };

  // Handle New Project Submission (Coordinators & Admins only)
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();

    const newProject: Project = {
      id: `prj-${Date.now()}`,
      ngoId: 'ngo-101',
      title,
      description,
      category,
      location,
      startDate,
      endDate,
      requiredVolunteers: parseInt(requiredVolunteers, 10) || 1,
      requiredSkills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
      status: 'PLANNED',
      createdBy: 'usr-2',
      createdAt: new Date().toISOString(),
    };

    setProjects([newProject, ...projects]);
    setIsDialogOpen(false);

    // Reset Form
    setTitle('');
    setDescription('');
    setLocation('');
    setStartDate('');
    setEndDate('');
    setSkillsInput('');
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'PLANNED':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Planned</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Completed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Role-Specific Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <FolderKanban className="h-7 w-7 text-blue-600" />
            {isVolunteer ? 'Volunteer Opportunities & Drives' : 'Project & Initiative Management'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isVolunteer
              ? 'Browse open grassroots drives, review required skills, and apply to contribute.'
              : 'Create social initiatives, specify volunteer requirements, and oversee milestones.'}
          </p>
        </div>

        {/* Action Button: ONLY visible for Coordinators and NGO Admins */}
        {!isVolunteer && (
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 self-start sm:self-auto shadow-xs"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {projects.map((project) => {
          const hasApplied = appliedProjects[project.id];

          return (
            <Card key={project.id} className="border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                    {project.category}
                  </Badge>
                  {getStatusBadge(project.status)}
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  {project.title}
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-xs text-gray-600">
                <div className="grid grid-cols-2 gap-2 py-2 border-t border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{project.requiredVolunteers} Volunteers Needed</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span suppressHydrationWarning>
                      {new Date(project.startDate).toLocaleDateString()} – {new Date(project.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Required Skills */}
                <div>
                  <span className="text-gray-400 block mb-1.5 flex items-center gap-1 font-medium">
                    <Wrench className="h-3 w-3" /> Desired Skillsets:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {project.requiredSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-[10px] bg-gray-100 text-gray-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>

              {/* Card Footer: Role Dependent Action */}
              <CardFooter className="pt-2 border-t border-gray-100 flex items-center justify-between">
                {isVolunteer ? (
                  hasApplied ? (
                    <Button disabled className="w-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Application Submitted (Pending)
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleApply(project.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" /> Apply for This Opportunity
                    </Button>
                  )
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-gray-500 font-mono">ID: {project.id}</span>
                    <Button variant="outline" size="sm" className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50">
                      Manage Roster
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Create Project Dialog (Protected: Only coordinators and admins) */}
      {!isVolunteer && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreateProject}>
              <DialogHeader>
                <DialogTitle>Launch New Project Initiative</DialogTitle>
                <DialogDescription>
                  Define social drive parameters and volunteer recruitment criteria.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-medium">Project Title</Label>
                  <Input
                    id="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Village Solar Electrification"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="desc" className="text-xs font-medium">Description</Label>
                  <Input
                    id="desc"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide overview of the social impact goals"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs font-medium">Category</Label>
                    <Input
                      id="category"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Education, Health"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-xs font-medium">Location</Label>
                    <Input
                      id="location"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Banasthali Sector 2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="start" className="text-xs font-medium">Start Date</Label>
                    <Input
                      id="start"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="end" className="text-xs font-medium">End Date</Label>
                    <Input
                      id="end"
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="volunteers" className="text-xs font-medium">Volunteers Required</Label>
                  <Input
                    id="volunteers"
                    type="number"
                    min="1"
                    required
                    value={requiredVolunteers}
                    onChange={(e) => setRequiredVolunteers(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="skills" className="text-xs font-medium">Required Skills (Comma separated)</Label>
                  <Input
                    id="skills"
                    required
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g. First Aid, Counseling, Teaching"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Publish Initiative
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}