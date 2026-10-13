// Role & Status Enums matching Prisma DB
export type Role = 'SUPER_ADMIN' | 'NGO_ADMIN' | 'COORDINATOR' | 'VOLUNTEER';
export type UserRole = Role;
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type NgoStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
export type AssignmentStatus = 'ASSIGNED' | 'ACCEPTED' | 'DONE';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

// User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  ngoId?: string | null;
  status: UserStatus;
  createdAt: string;
}

// NGO Interface
export interface Ngo {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  website?: string;
  registrationNumber: string;
  status: NgoStatus;
  verifiedAt?: string;
  rejectionReason?: string;
  documentUrl?: string;
  createdAt: string;
}

// Project Interface
export interface Project {
  id: string;
  ngoId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  requiredVolunteers: number;
  requiredSkills: string[];
  status: ProjectStatus;
  createdBy: string;
  createdAt: string;
}

// Task Interface
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  completedAt?: string;
  assignedTo?: string; // Volunteer user ID or name
}

// Volunteer Profile Interface
export interface VolunteerProfile {
  id: string;
  userId: string;
  skills: string[];
  availability: string;
  location: string;
  experience?: string;
  joinDate: string;
}

// Notification Interface
export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  link?: string;
  readAt?: string;
  createdAt: string;
}

// Standard API Response Wrapper
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}