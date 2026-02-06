import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create 3 sample internal users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@multiversebazaar.com' },
    update: {},
    create: {
      email: 'alice@multiversebazaar.com',
      name: 'Alice Johnson',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      bio: 'Full-stack developer passionate about building tools that empower creators.',
      isExternal: false,
      karma: 150,
      showEmailOnProfile: true,
      includeInSearch: true,
      showActivityPublicly: true,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@multiversebazaar.com' },
    update: {},
    create: {
      email: 'bob@multiversebazaar.com',
      name: 'Bob Smith',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      bio: 'Product designer with a love for clean interfaces and delightful experiences.',
      isExternal: false,
      karma: 95,
      invitedById: alice.id,
      showEmailOnProfile: false,
      includeInSearch: true,
      showActivityPublicly: true,
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@multiversebazaar.com' },
    update: {},
    create: {
      email: 'carol@multiversebazaar.com',
      name: 'Carol Martinez',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      bio: 'Backend engineer specializing in scalable distributed systems.',
      isExternal: false,
      karma: 120,
      invitedById: alice.id,
      showEmailOnProfile: true,
      includeInSearch: true,
      showActivityPublicly: false,
    },
  });

  console.log('Created users:', { alice, bob, carol });

  // Create 2 sample projects with collaborators
  const project1 = await prisma.project.upsert({
    where: { id: 'project-1' },
    update: {},
    create: {
      id: 'project-1',
      title: 'TaskFlow - Async Collaboration Tool',
      description: 'A modern task management platform designed for remote teams working across time zones. Features real-time updates, smart notifications, and integrated video calls.',
      url: 'https://taskflow.example.com',
      repoUrl: 'https://github.com/example/taskflow',
      imageUrl: 'https://picsum.photos/seed/taskflow/800/600',
      status: 'LAUNCHED',
      isFeatured: true,
    },
  });

  await prisma.collaborator.upsert({
    where: {
      userId_projectId: {
        userId: alice.id,
        projectId: project1.id,
      },
    },
    update: {},
    create: {
      userId: alice.id,
      projectId: project1.id,
      role: 'CREATOR',
    },
  });

  await prisma.collaborator.upsert({
    where: {
      userId_projectId: {
        userId: bob.id,
        projectId: project1.id,
      },
    },
    update: {},
    create: {
      userId: bob.id,
      projectId: project1.id,
      role: 'CONTRIBUTOR',
    },
  });

  await prisma.upvote.upsert({
    where: {
      userId_projectId: {
        userId: carol.id,
        projectId: project1.id,
      },
    },
    update: {},
    create: {
      userId: carol.id,
      projectId: project1.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'project-2' },
    update: {},
    create: {
      id: 'project-2',
      title: 'CodeSnap - Developer Productivity Suite',
      description: 'An AI-powered code snippet manager with smart tagging, cross-platform sync, and team sharing capabilities. Built for developers who value efficiency.',
      url: null,
      repoUrl: 'https://github.com/example/codesnap',
      imageUrl: 'https://picsum.photos/seed/codesnap/800/600',
      status: 'BUILDING',
      isFeatured: false,
    },
  });

  await prisma.collaborator.upsert({
    where: {
      userId_projectId: {
        userId: carol.id,
        projectId: project2.id,
      },
    },
    update: {},
    create: {
      userId: carol.id,
      projectId: project2.id,
      role: 'CREATOR',
    },
  });

  await prisma.collaborator.upsert({
    where: {
      userId_projectId: {
        userId: alice.id,
        projectId: project2.id,
      },
    },
    update: {},
    create: {
      userId: alice.id,
      projectId: project2.id,
      role: 'ADVISOR',
    },
  });

  await prisma.upvote.upsert({
    where: {
      userId_projectId: {
        userId: bob.id,
        projectId: project2.id,
      },
    },
    update: {},
    create: {
      userId: bob.id,
      projectId: project2.id,
    },
  });

  console.log('Created projects:', { project1, project2 });

  // Create 1 sample idea
  const idea1 = await prisma.idea.upsert({
    where: { id: 'idea-1' },
    update: {},
    create: {
      id: 'idea-1',
      title: 'Climate Data Visualization Platform',
      description: 'An interactive platform for visualizing climate change data from various sources. Would make it easier for researchers, journalists, and educators to understand and communicate climate trends.',
      lookingFor: 'Looking for: Frontend developer with D3.js experience, data scientist familiar with climate datasets, and UX designer passionate about data storytelling.',
      creatorId: bob.id,
      status: 'OPEN',
    },
  });

  await prisma.ideaInterest.upsert({
    where: {
      userId_ideaId: {
        userId: alice.id,
        ideaId: idea1.id,
      },
    },
    update: {},
    create: {
      userId: alice.id,
      ideaId: idea1.id,
      message: 'This sounds fascinating! I have experience with D3.js and would love to contribute to the frontend. Let\'s chat!',
    },
  });

  await prisma.ideaInterest.upsert({
    where: {
      userId_ideaId: {
        userId: carol.id,
        ideaId: idea1.id,
      },
    },
    update: {},
    create: {
      userId: carol.id,
      ideaId: idea1.id,
      message: 'I can help with the backend infrastructure and data pipelines. Count me in!',
    },
  });

  console.log('Created idea:', { idea1 });

  // Create sample notifications
  await prisma.notification.create({
    data: {
      userId: bob.id,
      type: 'IDEA_INTEREST',
      title: 'New interest in your idea',
      body: 'Alice Johnson is interested in "Climate Data Visualization Platform"',
      data: {
        ideaId: idea1.id,
        interestedUserId: alice.id,
      },
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: alice.id,
      type: 'UPVOTE',
      title: 'Someone upvoted your project!',
      body: 'Carol Martinez upvoted "TaskFlow - Async Collaboration Tool"',
      data: {
        projectId: project1.id,
        upvoterId: carol.id,
      },
      read: true,
    },
  });

  console.log('Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
