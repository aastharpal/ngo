export interface NavItem {
  title: string;
  href: string;
  roles: string[];
  icon?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    roles: ['SUPER_ADMIN', 'NGO_ADMIN', 'COORDINATOR', 'VOLUNTEER'],
  },
  {
    title: 'NGO Verification',
    href: '/admin/ngos',
    roles: ['SUPER_ADMIN'],
  },
  {
    title: 'Projects & Opportunities',
    href: '/projects',
    roles: ['NGO_ADMIN', 'COORDINATOR', 'VOLUNTEER'],
  },
  {
    title: 'Browse NGOs',
    href: '/ngos',
    roles: ['VOLUNTEER', 'COORDINATOR', 'NGO_ADMIN', 'SUPER_ADMIN'],
  },
  {
    title: 'Task Management',
    href: '/tasks',
    roles: ['NGO_ADMIN', 'COORDINATOR'],
  },
  {
    title: 'My Assigned Tasks',
    href: '/tasks',
    roles: ['VOLUNTEER'],
  },
  {
    title: 'Volunteer Applications',
    href: '/invitations',
    roles: ['NGO_ADMIN', 'COORDINATOR'],
  },
  {
    title: 'My Applications',
    href: '/invitations',
    roles: ['VOLUNTEER'],
  },
  {
    title: 'NGO Organization Profile',
    href: '/ngo/profile',
    roles: ['NGO_ADMIN', 'COORDINATOR'],
  },
];