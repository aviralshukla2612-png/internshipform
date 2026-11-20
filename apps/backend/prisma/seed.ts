import { PrismaClient, UserRoleType, UserStatus, JobStatus, EmploymentType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Enterprise Recruitment System Seeding ---');

  // 1. Seed Roles
  const roles = [
    {
      name: UserRoleType.SUPER_ADMIN,
      description: 'Super Administrator with full unrestricted platform access',
    },
    {
      name: UserRoleType.HR_ADMIN,
      description: 'HR Administrator with permissions to manage candidates, applications, and interviews',
    },
    {
      name: UserRoleType.INTERVIEWER,
      description: 'Interviewer role restricted to assigned candidate evaluations and feedback submission',
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  console.log('✓ Roles seeded successfully.');

  // 2. Seed Granular Permissions
  const permissions = [
    // Applications & Candidates
    { action: 'candidates:read', module: 'candidates', description: 'View candidate profiles' },
    { action: 'candidates:export', module: 'candidates', description: 'Export candidate data to CSV/Excel' },
    { action: 'candidates:edit', module: 'candidates', description: 'Modify candidate information' },
    { action: 'applications:read', module: 'applications', description: 'View job applications' },
    { action: 'applications:status:update', module: 'applications', description: 'Update application status (shortlist/reject)' },
    { action: 'documents:download', module: 'documents', description: 'Download candidate uploaded marksheets and resumes' },
    // Jobs
    { action: 'jobs:read', module: 'jobs', description: 'View job postings' },
    { action: 'jobs:write', module: 'jobs', description: 'Create and edit job postings' },
    { action: 'jobs:delete', module: 'jobs', description: 'Archive/delete job postings' },
    // Interviews
    { action: 'interviews:read', module: 'interviews', description: 'View scheduled interviews' },
    { action: 'interviews:schedule', module: 'interviews', description: 'Schedule or reschedule interviews' },
    { action: 'interviews:cancel', module: 'interviews', description: 'Cancel interviews' },
    { action: 'feedback:submit', module: 'feedback', description: 'Submit interview evaluation feedback' },
    { action: 'feedback:read', module: 'feedback', description: 'Read submitted interview feedback' },
    // Messaging & Integrations
    { action: 'whatsapp:send', module: 'whatsapp', description: 'Trigger WhatsApp notifications' },
    { action: 'whatsapp:logs:read', module: 'whatsapp', description: 'View WhatsApp delivery logs' },
    { action: 'email:logs:read', module: 'email', description: 'View transactional email logs' },
    // Administration & Security
    { action: 'users:manage', module: 'users', description: 'Create and manage admin and interviewer accounts' },
    { action: 'audit:read', module: 'audit', description: 'Inspect tamper-resistant compliance audit logs' },
    { action: 'settings:manage', module: 'settings', description: 'Update system settings and integration keys' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { action: perm.action },
      update: { description: perm.description, module: perm.module },
      create: perm,
    });
  }
  console.log('✓ Granular permissions seeded successfully.');

  // 3. Map Permissions to Roles
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: UserRoleType.SUPER_ADMIN } });
  const hrAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: UserRoleType.HR_ADMIN } });
  const interviewerRole = await prisma.role.findUniqueOrThrow({ where: { name: UserRoleType.INTERVIEWER } });

  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }

  const hrPermActions = [
    'candidates:read', 'candidates:export', 'candidates:edit',
    'applications:read', 'applications:status:update', 'documents:download',
    'jobs:read', 'jobs:write',
    'interviews:read', 'interviews:schedule', 'interviews:cancel',
    'feedback:read',
    'whatsapp:send', 'whatsapp:logs:read', 'email:logs:read',
  ];

  for (const perm of allPerms.filter((p) => hrPermActions.includes(p.action))) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: hrAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: { roleId: hrAdminRole.id, permissionId: perm.id },
    });
  }

  const interviewerPermActions = [
    'candidates:read',
    'documents:download',
    'interviews:read',
    'feedback:submit',
    'feedback:read',
  ];

  for (const perm of allPerms.filter((p) => interviewerPermActions.includes(p.action))) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: interviewerRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: { roleId: interviewerRole.id, permissionId: perm.id },
    });
  }
  console.log('✓ Role permissions assigned.');

  // 4. Seed Initial Super Admin User
  const defaultAdminEmail = process.env.INITIAL_SUPERADMIN_EMAIL || 'admin@enterprise.com';
  const defaultAdminPassword = process.env.INITIAL_SUPERADMIN_PASSWORD || 'AdminSecurePassword123!@#';
  const passwordHash = await argon2.hash(defaultAdminPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });

  const superAdmin = await prisma.adminUser.upsert({
    where: { email: defaultAdminEmail },
    update: {
      fullName: 'System Super Administrator',
      status: UserStatus.ACTIVE,
    },
    create: {
      email: defaultAdminEmail,
      passwordHash,
      fullName: 'System Super Administrator',
      department: 'Executive Management',
      designation: 'Chief Technology Officer',
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: { userId: superAdmin.id, roleId: superAdminRole.id },
  });
  console.log(`✓ Super Admin created: ${defaultAdminEmail}`);

  // Seed sample Interviewer Admin
  const sampleInterviewerEmail = 'interviewer@enterprise.com';
  const sampleInterviewerHash = await argon2.hash('Interviewer123!@#', {
    type: argon2.argon2id,
  });
  const interviewerUser = await prisma.adminUser.upsert({
    where: { email: sampleInterviewerEmail },
    update: {},
    create: {
      email: sampleInterviewerEmail,
      passwordHash: sampleInterviewerHash,
      fullName: 'Jane Doe (Lead Architect)',
      department: 'Engineering',
      designation: 'Principal Engineer',
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: interviewerUser.id,
        roleId: interviewerRole.id,
      },
    },
    update: {},
    create: { userId: interviewerUser.id, roleId: interviewerRole.id },
  });

  // 5. Seed Initial System Settings
  const defaultSettings = [
    { key: 'COMPANY_NAME', value: 'Enterprise Tech Solutions Pvt Ltd', description: 'Official corporate organization name' },
    { key: 'COMPANY_WEBSITE', value: 'https://www.enterprisetech.com', description: 'Company primary domain' },
    { key: 'WHATSAPP_AUTO_REMINDER_HOURS', value: '24,2', description: 'Comma separated hours before interview to dispatch automatic reminders' },
    { key: 'MAX_RESUME_SIZE_MB', value: '5', description: 'Maximum allowed resume file upload size in MB' },
    { key: 'MAX_MARKSHEET_SIZE_MB', value: '5', description: 'Maximum allowed marksheet upload size in MB' },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }
  console.log('✓ System settings initialized.');

  // 6. Seed Primary Internship Program Position
  await prisma.jobPosition.upsert({
    where: { slug: 'internship-program' },
    update: {
      title: 'Full-Stack & AI Engineering Internship Program',
      department: 'Engineering & Innovation',
      jobDescription: 'Intensive practical industry internship covering AI/ML integration, MERN & MEAN full-stack architectures, database modeling & logic, scalable backend systems, and production cloud deployment.',
      requiredQualification: 'Pursuing or Completed Degree (B.Tech / B.E / BCA / MCA / B.Sc / Any Degree)',
      requiredSkills: ['AI / ML', 'MERN Stack', 'MEAN Stack', 'PostgreSQL', 'Database Logic', 'Docker'],
      openingsCount: 50,
      jobLocation: 'Hybrid / Remote / Office',
      employmentType: EmploymentType.INTERNSHIP,
      status: JobStatus.PUBLISHED,
    },
    create: {
      title: 'Full-Stack & AI Engineering Internship Program',
      slug: 'internship-program',
      department: 'Engineering & Innovation',
      jobDescription: 'Intensive practical industry internship covering AI/ML integration, MERN & MEAN full-stack architectures, database modeling & logic, scalable backend systems, and production cloud deployment.',
      requiredQualification: 'Pursuing or Completed Degree (B.Tech / B.E / BCA / MCA / B.Sc / Any Degree)',
      requiredSkills: ['AI / ML', 'MERN Stack', 'MEAN Stack', 'PostgreSQL', 'Database Logic', 'Docker'],
      openingsCount: 50,
      jobLocation: 'Hybrid / Remote / Office',
      employmentType: EmploymentType.INTERNSHIP,
      status: JobStatus.PUBLISHED,
    },
  });
  console.log('✓ Primary Internship Program position seeded: internship-program');

  // 7. Seed Sample Published Job Opening
  await prisma.jobPosition.upsert({
    where: { slug: 'senior-full-stack-engineer' },
    update: {},
    create: {
      title: 'Senior Full-Stack Engineer (NestJS / Next.js)',
      slug: 'senior-full-stack-engineer',
      department: 'Engineering',
      jobDescription: 'We are seeking a high-caliber Senior Full-Stack Engineer with deep experience in Next.js 15, NestJS, TypeScript, PostgreSQL, and scalable distributed architectures.',
      requiredQualification: 'B.Tech / B.E. in Computer Science or equivalent',
      requiredSkills: ['Next.js', 'NestJS', 'TypeScript', 'PostgreSQL', 'Docker', 'Redis'],
      experienceMinYears: 4,
      experienceMaxYears: 8,
      openingsCount: 3,
      jobLocation: 'Bengaluru / Remote',
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 1800000,
      salaryMax: 3000000,
      status: JobStatus.PUBLISHED,
    },
  });
  console.log('✓ Sample published job position seeded: senior-full-stack-engineer');

  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
