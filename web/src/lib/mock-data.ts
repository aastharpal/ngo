import { Ngo, User, Project, Task, Notification } from '@/types';

export const MOCK_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Admin User',
    email: 'admin@servelink.org',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-2',
    name: 'Ananya Sharma',
    email: 'ananya@hopefoundation.org',
    role: 'NGO_ADMIN',
    ngoId: 'ngo-101',
    status: 'ACTIVE',
    createdAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'usr-3',
    name: 'Rohan Mehta',
    email: 'rohan@hopefoundation.org',
    role: 'COORDINATOR',
    ngoId: 'ngo-101',
    status: 'ACTIVE',
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'usr-4',
    name: 'Priya Verma',
    email: 'priya@gmail.com',
    role: 'VOLUNTEER',
    ngoId: 'ngo-101',
    status: 'ACTIVE',
    createdAt: '2026-03-01T00:00:00Z',
  },
];

export const MOCK_NGOS: Ngo[] = [
  {
    id: 'ngo-101',
    name: 'Hope Foundation',
    email: 'contact@hopefoundation.org',
    phone: '+91 9876543210',
    address: 'Jaipur, Rajasthan',
    description: 'Empowering underprivileged communities through education and healthcare support.',
    website: 'https://hopefoundation.org',
    registrationNumber: 'REG-2024-8891',
    status: 'PENDING',
    createdAt: '2026-03-28T10:00:00Z',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'ngo-102',
    name: 'Green Earth Trust',
    email: 'info@greenearth.org',
    phone: '+91 9812345678',
    address: 'Banasthali, Rajasthan',
    description: 'Dedicated to environmental conservation, tree plantation, and clean water drives.',
    website: 'https://greenearth.org',
    registrationNumber: 'REG-2023-4412',
    status: 'VERIFIED',
    verifiedAt: '2026-01-16T11:00:00Z',
    createdAt: '2026-01-15T09:30:00Z',
  },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'prj-101',
    ngoId: 'ngo-101',
    title: 'Clean Water Relief Drive',
    description: 'Distributing clean drinking water and purification tablets in rural areas.',
    category: 'Healthcare',
    location: 'Banasthali Region',
    startDate: '2026-10-15',
    endDate: '2026-11-15',
    requiredVolunteers: 15,
    requiredSkills: ['Logistics', 'First Aid', 'Community Outreach'],
    status: 'ACTIVE',
    createdBy: 'usr-2',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'prj-102',
    ngoId: 'ngo-101',
    title: 'Youth Literacy Workshop',
    description: 'Weekend teaching sessions for primary school children.',
    category: 'Education',
    location: 'Jaipur Community Center',
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    requiredVolunteers: 10,
    requiredSkills: ['Teaching', 'English', 'Mathematics'],
    status: 'PLANNED',
    createdBy: 'usr-2',
    createdAt: '2026-03-10T10:00:00Z',
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'tsk-1',
    projectId: 'prj-101',
    title: 'Distribute clean water kits in Sector 4',
    description: 'Deliver 50 water kits to designated households and log recipients.',
    priority: 'HIGH',
    deadline: '2026-10-10T17:00:00Z',
    status: 'IN_PROGRESS',
    assignedTo: 'Priya Verma',
  },
  {
    id: 'tsk-2',
    projectId: 'prj-101',
    title: 'Verify volunteer registration details',
    description: 'Cross-check contact phone numbers and availability hours.',
    priority: 'MEDIUM',
    deadline: '2026-10-12T12:00:00Z',
    status: 'PENDING',
    assignedTo: 'Rohan Mehta',
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'usr-4',
    type: 'TASK_ASSIGNED',
    message: 'You have been assigned to task: Distribute clean water kits in Sector 4',
    link: '/tasks',
    createdAt: '2026-10-02T08:00:00Z',
  },
];