require('dotenv').config();

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// Enable CORS for frontend requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// ==================== AUTHENTICATION ROUTES ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        volunteerProfile: true,
        projectCoordinators: { include: { project: true } },
        ngoMemberships: { include: { ngo: true } }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found. Please verify your email address.' });
    }

    // Detect if user has Coordinator privileges in addition to/instead of Volunteer
    const hasCoordinatorAccess =
      user.role === 'COORDINATOR' ||
      (user.projectCoordinators && user.projectCoordinators.length > 0) ||
      (user.ngoMemberships && user.ngoMemberships.some(m => m.role === 'COORDINATOR'));

    res.json({
      message: 'Login successful',
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role, // 'VOLUNTEER', 'NGO_ADMIN', 'SUPER_ADMIN', 'COORDINATOR'
        isCoordinator: hasCoordinatorAccess,
        volunteerProfile: user.volunteerProfile,
        ngoMemberships: user.ngoMemberships,
        projectCoordinators: user.projectCoordinators
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// Register Volunteer Endpoint
app.post('/api/auth/register-volunteer', async (req, res) => {
  try {
    const { name, email, password, phone, skills, availability, location, experience } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ error: `An account with email "${cleanEmail}" already exists. Please sign in instead.` });
    }

    // Atomic transaction: create user and volunteer profile together
    const { newUser, profile } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: String(password),
          phone: phone ? String(phone).trim() : 'N/A',
          role: 'VOLUNTEER',
          status: 'ACTIVE'
        }
      });

      const prof = await tx.volunteerProfile.create({
        data: {
          userId: user.userId,
          skills: skills ? String(skills).trim() : 'General Volunteer Support',
          availability: availability ? String(availability).trim() : 'Flexible',
          location: location ? String(location).trim() : 'Not specified',
          experience: experience ? String(experience).trim() : null,
          status: 'ACTIVE'
        }
      });

      return { newUser: user, profile: prof };
    });

    console.log(`[Auth] Registered new volunteer: ${newUser.name} (${newUser.email}), userId: ${newUser.userId}`);

    res.status(201).json({
      message: 'Volunteer account created successfully!',
      user: {
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isCoordinator: false,
        volunteerProfile: profile
      }
    });
  } catch (error) {
    console.error('[Register Volunteer Error]:', error);
    res.status(500).json({ error: 'Failed to create volunteer account', details: error.message });
  }
});

// Register NGO Onboarding Request Endpoint
app.post('/api/auth/register-ngo', async (req, res) => {
  try {
    const {
      adminName,
      adminEmail,
      adminPassword,
      adminPhone,
      ngoName,
      ngoEmail,
      ngoPhone,
      address,
      description,
      website,
      registrationNumber
    } = req.body;

    if (!adminName || !adminEmail || !adminPassword || !ngoName || !registrationNumber) {
      return res.status(400).json({
        error: 'Administrator details, NGO Name, and Legal Registration Number are required.'
      });
    }

    const cleanAdminEmail = adminEmail.trim().toLowerCase();
    const cleanNgoEmail = (ngoEmail || adminEmail).trim().toLowerCase();
    const regNum = registrationNumber.trim().toUpperCase();

    // Check if user or reg number already exists
    const existingUser = await prisma.user.findUnique({ where: { email: cleanAdminEmail } });
    if (existingUser) {
      return res.status(409).json({ error: `An account with administrator email "${cleanAdminEmail}" already exists. Please sign in instead.` });
    }

    const existingNgo = await prisma.ngo.findUnique({ where: { registrationNumber: regNum } });
    if (existingNgo) {
      return res.status(409).json({ error: `An NGO with registration number "${regNum}" is already registered.` });
    }

    // Atomic transaction: create NGO, NGO Admin, and Membership together
    const { newNgo, newAdmin } = await prisma.$transaction(async (tx) => {
      const ngo = await tx.ngo.create({
        data: {
          name: ngoName.trim(),
          email: cleanNgoEmail,
          phone: ngoPhone ? String(ngoPhone).trim() : (adminPhone ? String(adminPhone).trim() : 'N/A'),
          address: address ? String(address).trim() : 'Not specified',
          description: description ? String(description).trim() : 'Community and social empowerment initiative',
          website: website ? String(website).trim() : null,
          registrationNumber: regNum,
          status: 'PENDING' // Awaits Super Admin Verification!
        }
      });

      const admin = await tx.user.create({
        data: {
          name: adminName.trim(),
          email: cleanAdminEmail,
          password: String(adminPassword),
          phone: adminPhone ? String(adminPhone).trim() : 'N/A',
          role: 'NGO_ADMIN',
          status: 'ACTIVE'
        }
      });

      await tx.ngoMembership.create({
        data: {
          userId: admin.userId,
          ngoId: ngo.ngoId,
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });

      return { newNgo: ngo, newAdmin: admin };
    });

    console.log(`[Auth] Submitted new NGO: ${newNgo.name} (${newNgo.registrationNumber}) by ${newAdmin.name}`);

    res.status(201).json({
      message: 'NGO onboarding request submitted successfully for verification!',
      user: {
        userId: newAdmin.userId,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        isCoordinator: false,
        ngo: newNgo
      },
      ngo: newNgo
    });
  } catch (error) {
    console.error('[Register NGO Error]:', error);
    res.status(500).json({ error: 'Failed to submit NGO request', details: error.message });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', async (req, res) => {
  try {
    const usersCount = await prisma.user.count();
    res.json({ status: 'Connected to database successfully!', totalUsers: usersCount });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// ==================== USERS ROUTES ====================
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// ==================== VOLUNTEER ROUTES ====================
app.get('/api/volunteers/:userId/summary', async (req, res) => {
  try {
    const userId = toNumber(req.params.userId, 0);
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        volunteerProfile: true,
        ngoMemberships: { include: { ngo: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = user.volunteerProfile;
    let assignedTasks = [];
    let applications = [];

    if (profile) {
      // Fetch real assigned tasks from TaskAssignment
      const assignments = await prisma.taskAssignment.findMany({
        where: { profileId: profile.profileId },
        include: {
          task: {
            include: { project: { include: { ngo: true } } }
          }
        }
      });

      assignedTasks = assignments.map((a) => ({
        assignmentId: a.assignmentId,
        taskId: a.taskId,
        title: a.task.title,
        description: a.task.description,
        status: a.status || a.task.status,
        dueDate: a.task.dueDate,
        projectName: a.task.project ? a.task.project.title : 'General Project',
        ngoName: a.task.project && a.task.project.ngo ? a.task.project.ngo.name : 'ServeLink Partner',
        hoursLogged: a.hoursLogged || 0
      }));

      // Fetch real applications
      const rawApps = await prisma.volunteerApplication.findMany({
        where: { profileId: profile.profileId },
        include: {
          opportunity: {
            include: { project: { include: { ngo: true } } }
          }
        }
      });

      applications = rawApps.map((app) => ({
        applicationId: app.applicationId,
        opportunityId: app.opportunityId,
        title: app.opportunity ? app.opportunity.title : 'Volunteer Application',
        status: app.status,
        appliedAt: app.appliedAt,
        projectName: app.opportunity && app.opportunity.project ? app.opportunity.project.title : 'Impact Initiative',
        ngoName: app.opportunity && app.opportunity.project && app.opportunity.project.ngo ? app.opportunity.project.ngo.name : 'Partner NGO'
      }));
    }

    // Determine primary NGO if affiliated with ACTIVE status
    let primaryNgo = null;
    const activeMembership = (user.ngoMemberships || []).find(
      (m) => m.status === 'ACTIVE' && (m.role === 'VOLUNTEER' || m.role === 'MEMBER' || m.role === 'ADMIN')
    );
    if (activeMembership) {
      primaryNgo = activeMembership.ngo.name;
    } else {
      const acceptedApp = applications.find((a) => a.status === 'ACCEPTED');
      if (acceptedApp) {
        primaryNgo = acceptedApp.ngoName;
      }
    }

    // Also include direct NGO membership applications in applications list
    const directNgoApps = (user.ngoMemberships || [])
      .filter((m) => m.role === 'VOLUNTEER')
      .map((m) => ({
        applicationId: m.membershipId,
        opportunityId: 0,
        title: `Volunteer Membership Application (${m.ngo.name})`,
        status: m.status,
        appliedAt: m.joinedDate,
        projectName: 'NGO Direct Affiliation',
        ngoName: m.ngo.name
      }));

    applications = [...directNgoApps, ...applications];

    const completedTasks = assignedTasks.filter((t) => t.status === 'COMPLETED');
    const pendingTasks = assignedTasks.filter((t) => t.status !== 'COMPLETED');
    const totalHours = assignedTasks.reduce((acc, t) => acc + (t.hoursLogged || 0), 0);

    res.json({
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
      },
      profile,
      primaryNgo, // null if newly registered volunteer!
      metrics: {
        assignedTasksCount: pendingTasks.length,
        completedTasksCount: completedTasks.length,
        hoursLogged: totalHours,
        applicationsCount: applications.length
      },
      assignedTasks,
      applications
    });
  } catch (error) {
    console.error('[Volunteer Summary Error]:', error);
    res.status(500).json({ error: 'Failed to fetch volunteer summary', details: error.message });
  }
});

app.get('/api/volunteers/:userId/tasks', async (req, res) => {
  try {
    const userId = toNumber(req.params.userId, 0);
    const user = await prisma.user.findUnique({
      where: { userId },
      include: { volunteerProfile: true }
    });

    if (!user || !user.volunteerProfile) {
      return res.json([]);
    }

    const assignments = await prisma.taskAssignment.findMany({
      where: { profileId: user.volunteerProfile.profileId },
      include: {
        task: {
          include: { project: { include: { ngo: true } } }
        }
      }
    });

    const tasks = assignments.map((a) => ({
      id: `tsk-${a.task.taskId}`,
      assignmentId: a.assignmentId,
      projectId: `prj-${a.task.projectId}`,
      title: a.task.title,
      description: a.task.description,
      priority: a.task.priority || 'MEDIUM',
      deadline: a.task.dueDate ? a.task.dueDate.toISOString() : new Date().toISOString(),
      status: a.status || a.task.status,
      assignedTo: user.name,
      projectName: a.task.project ? a.task.project.title : 'Project',
      ngoName: a.task.project && a.task.project.ngo ? a.task.project.ngo.name : 'NGO'
    }));

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch volunteer tasks', details: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, phone, role, status } = req.body;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        phone,
        role: role || 'VOLUNTEER',
        status: status || 'ACTIVE'
      }
    });

    res.status(201).json({ message: 'User created successfully', newUser });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create user', details: error.message });
  }
});

// ==================== NGO ROUTES ====================
app.get('/api/ngos', async (req, res) => {
  try {
    const userId = req.query.userId ? toNumber(req.query.userId, 0) : null;
    const ngos = await prisma.ngo.findMany({
      include: {
        projects: { select: { projectId: true, title: true, status: true } },
        ngoMemberships: {
          select: { membershipId: true, userId: true, role: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = ngos.map((ngo) => {
      let userStatus = null;
      if (userId) {
        const mem = ngo.ngoMemberships.find((m) => m.userId === userId);
        if (mem) {
          userStatus = mem.status; // 'PENDING' | 'ACTIVE' | 'REJECTED'
        }
      }

      return {
        ngoId: ngo.ngoId,
        name: ngo.name,
        email: ngo.email,
        phone: ngo.phone,
        address: ngo.address,
        description: ngo.description,
        website: ngo.website,
        registrationNumber: ngo.registrationNumber,
        status: ngo.status, // 'VERIFIED' | 'PENDING' | 'REJECTED'
        createdAt: ngo.createdAt,
        projectsCount: ngo.projects.length,
        volunteersCount: ngo.ngoMemberships.filter(
          (m) => m.role === 'VOLUNTEER' && m.status === 'ACTIVE'
        ).length,
        userStatus
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch NGOs', details: error.message });
  }
});

// Volunteer Apply to Join an NGO directly
app.post('/api/ngos/:id/apply', async (req, res) => {
  try {
    const ngoId = toNumber(req.params.id, 0);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const cleanUserId = toNumber(userId, 0);

    const user = await prisma.user.findUnique({ where: { userId: cleanUserId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ngo = await prisma.ngo.findUnique({ where: { ngoId } });
    if (!ngo) {
      return res.status(404).json({ error: 'NGO not found' });
    }

    // Check if membership or application already exists
    const existing = await prisma.ngoMembership.findFirst({
      where: { userId: cleanUserId, ngoId }
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return res.status(409).json({ error: 'You are already an active volunteer for this NGO.' });
      }
      return res.status(409).json({ error: 'You have already submitted an application to this NGO (Pending Review).' });
    }

    // Create NgoMembership with role: 'VOLUNTEER' and status: 'PENDING'
    const membership = await prisma.ngoMembership.create({
      data: {
        userId: cleanUserId,
        ngoId,
        role: 'VOLUNTEER',
        status: 'PENDING'
      },
      include: {
        ngo: true,
        user: true
      }
    });

    console.log(`[NGO Application] Volunteer ${user.name} applied to join ${ngo.name}`);

    res.status(201).json({
      message: `Application submitted to ${ngo.name} successfully!`,
      membership
    });
  } catch (error) {
    console.error('[NGO Apply Error]:', error);
    res.status(500).json({ error: 'Failed to apply to NGO', details: error.message });
  }
});

app.post('/api/ngos', async (req, res) => {
  try {
    const body = req.body || {};
    const newNgo = await prisma.ngo.create({
      data: {
        name: body.name || body.organizationName || 'Unnamed NGO',
        email: body.email || body.organizationEmail || `ngo-${Date.now()}@example.com`,
        phone: body.phone || body.organizationPhone || 'N/A',
        address: body.address || body.location || 'Not specified',
        description: body.description || body.causeArea || 'General support',
        website: body.website || null,
        registrationNumber: body.registrationNumber || `REG-${Date.now()}`,
        status: body.status || body.verificationStatus || 'PENDING'
      }
    });

    res.status(201).json({ message: 'NGO registered successfully', newNgo });
  } catch (error) {
    res.status(400).json({ error: 'Failed to register NGO', details: error.message });
  }
});

// Update NGO Verification Status (Super Admin)
app.patch('/api/ngos/:id/status', async (req, res) => {
  try {
    const ngoId = toNumber(req.params.id, 0);
    const { status } = req.body; // 'VERIFIED' | 'REJECTED' | 'PENDING'

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updated = await prisma.ngo.update({
      where: { ngoId },
      data: { status }
    });

    res.json({ message: `NGO status updated to ${status}`, ngo: updated });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update NGO status', details: error.message });
  }
});

// ==================== PROJECT ROUTES ====================
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ include: { ngo: true } });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { ngoId, title, description, location, startDate, endDate, requiredVolunteers, status } = req.body;

    const defaultStart = new Date();
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 30);

    const newProject = await prisma.project.create({
      data: {
        ngoId: toNumber(ngoId, 0),
        title: title || 'New Project',
        description: description || 'Project description',
        location: location || 'Not specified',
        startDate: startDate ? new Date(startDate) : defaultStart,
        endDate: endDate ? new Date(endDate) : defaultEnd,
        requiredVolunteers: toNumber(requiredVolunteers, 10),
        status: status || 'OPEN'
      }
    });

    res.status(201).json({ message: 'Project created successfully', newProject });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create project', details: error.message });
  }
});

// ==================== TASK ROUTES ====================
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({ include: { project: true } });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { projectId, title, description, dueDate, status, priority } = req.body;

    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);

    const newTask = await prisma.task.create({
      data: {
        projectId: toNumber(projectId, 0),
        title: title || 'New Task',
        description: description || 'Task description',
        dueDate: dueDate ? new Date(dueDate) : defaultDueDate,
        status: status || 'OPEN',
        priority: priority || 'MEDIUM'
      }
    });

    res.status(201).json({ message: 'Task created successfully', newTask });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create task', details: error.message });
  }
});

// ==================== RESOURCE ROUTES ====================
app.get('/api/resources', async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({ include: { ngo: true } });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resources', details: error.message });
  }
});

app.post('/api/resources', async (req, res) => {
  try {
    const { ngoId, name, type, quantity, description, location, availabilityStatus } = req.body;

    const newResource = await prisma.resource.create({
      data: {
        ngoId: toNumber(ngoId, 0),
        name: name || 'Resource',
        type: type || 'General',
        quantity: toNumber(quantity, 1),
        description: description || null,
        location: location || null,
        availabilityStatus: availabilityStatus || 'AVAILABLE'
      }
    });

    res.status(201).json({ message: 'Resource created successfully', newResource });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create resource', details: error.message });
  }
});

// ==================== OPPORTUNITY ROUTES ====================
app.get('/api/opportunities', async (req, res) => {
  try {
    const opportunities = await prisma.opportunity.findMany({
      include: {
        project: { include: { ngo: true } },
        applications: true
      }
    });
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch opportunities', details: error.message });
  }
});

app.post('/api/opportunities', async (req, res) => {
  try {
    const { projectId, title, requiredSkills, volunteersNeeded } = req.body;

    const newOpportunity = await prisma.opportunity.create({
      data: {
        projectId: toNumber(projectId, 0),
        title: title || 'Volunteer Opportunity',
        requiredSkills: requiredSkills || 'General Support',
        volunteersNeeded: toNumber(volunteersNeeded, 5)
      }
    });

    res.status(201).json({ message: 'Opportunity created successfully', newOpportunity });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create opportunity', details: error.message });
  }
});

// ==================== APPLICATION ROUTES ====================
app.get('/api/applications', async (req, res) => {
  try {
    const applications = await prisma.volunteerApplication.findMany({
      include: {
        volunteerProfile: { include: { user: true } },
        opportunity: { include: { project: true } }
      }
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
  }
});

app.post('/api/applications', async (req, res) => {
  try {
    let { profileId, userId, opportunityId, status } = req.body;

    // If userId is provided without profileId, resolve or create the VolunteerProfile
    if (!profileId && userId) {
      let profile = await prisma.volunteerProfile.findUnique({
        where: { userId: toNumber(userId, 0) }
      });
      if (!profile) {
        profile = await prisma.volunteerProfile.create({
          data: {
            userId: toNumber(userId, 0),
            skills: 'General Volunteer Skills',
            availability: 'Flexible',
            location: 'Not specified',
            status: 'ACTIVE'
          }
        });
      }
      profileId = profile.profileId;
    }

    // If opportunityId is not provided but projectId is passed, resolve or create opportunity
    if (!opportunityId && req.body.projectId) {
      const pId = toNumber(req.body.projectId, 0);
      let opp = await prisma.opportunity.findFirst({ where: { projectId: pId } });
      if (!opp) {
        opp = await prisma.opportunity.create({
          data: {
            projectId: pId,
            title: 'Field Volunteer Contributor',
            requiredSkills: 'General Outreach',
            volunteersNeeded: 10
          }
        });
      }
      opportunityId = opp.opportunityId;
    }

    const newApplication = await prisma.volunteerApplication.create({
      data: {
        profileId: toNumber(profileId, 0),
        opportunityId: toNumber(opportunityId, 0),
        status: status || 'PENDING'
      },
      include: {
        volunteerProfile: { include: { user: true } },
        opportunity: true
      }
    });

    res.status(201).json({ message: 'Application submitted successfully', newApplication });
  } catch (error) {
    res.status(400).json({ error: 'Failed to submit application', details: error.message });
  }
});

// Update Application Status (Approve/Reject)
app.patch('/api/applications/:id/status', async (req, res) => {
  try {
    const applicationId = toNumber(req.params.id, 0);
    const { status } = req.body; // 'ACCEPTED' | 'REJECTED' | 'PENDING'

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updated = await prisma.volunteerApplication.update({
      where: { applicationId },
      data: { status },
      include: {
        volunteerProfile: { include: { user: true } },
        opportunity: { include: { project: { include: { ngo: true } } } }
      }
    });

    res.json({ message: `Application status updated to ${status}`, application: updated });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update application status', details: error.message });
  }
});

// ==================== START SERVER ====================


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});