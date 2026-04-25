require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User.model');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');

const seed = async () => {
  await connectDB();
  console.log('\n🌱 Starting database seeder...\n');

  try {
    // ── Clean existing data ──────────────────────────────────
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // ── Create Users ─────────────────────────────────────────
    const salt = await bcrypt.genSalt(12);

    const users = await User.insertMany([
      {
        name: 'Arjun Sharma',
        email: 'admin@erp.com',
        password: await bcrypt.hash('admin123', salt),
        role: 'Admin',
        avatar: 'AS',
        isActive: true
      },
      {
        name: 'Priya Nair',
        email: 'manager@erp.com',
        password: await bcrypt.hash('manager123', salt),
        role: 'Manager',
        avatar: 'PN',
        isActive: true
      },
      {
        name: 'Kiran Dev',
        email: 'dev@erp.com',
        password: await bcrypt.hash('dev123', salt),
        role: 'Developer',
        avatar: 'KD',
        isActive: true
      },
      {
        name: 'Sneha Rao',
        email: 'sneha@erp.com',
        password: await bcrypt.hash('sneha123', salt),
        role: 'Developer',
        avatar: 'SR',
        isActive: true
      }
    ]);

    const [admin, manager, dev1, dev2] = users;
    console.log(`✅ Created ${users.length} users`);

    // ── Create Projects ──────────────────────────────────────
    const projects = await Project.insertMany([
      {
        name: 'E-Commerce Platform',
        description: 'Full-stack marketplace with payment integration and real-time inventory tracking.',
        status: 'In Progress',
        deadline: new Date('2026-06-30'),
        createdBy: admin._id,
        members: [admin._id, manager._id, dev1._id]
      },
      {
        name: 'Analytics Dashboard',
        description: 'Real-time business intelligence dashboard with custom reporting engine.',
        status: 'Todo',
        deadline: new Date('2026-05-15'),
        createdBy: manager._id,
        members: [admin._id, manager._id, dev2._id]
      },
      {
        name: 'Mobile App — iOS/Android',
        description: 'Cross-platform React Native app for field operations with offline support.',
        status: 'In Progress',
        deadline: new Date('2026-08-31'),
        createdBy: admin._id,
        members: [admin._id, dev1._id, dev2._id]
      }
    ]);

    const [proj1, proj2, proj3] = projects;
    console.log(`✅ Created ${projects.length} projects`);

    // ── Create Tasks ──────────────────────────────────────────
    const taskData = [
      // Project 1 tasks
      { title: 'Design MongoDB schemas', description: 'Create schemas for products, orders, users', priority: 'High', status: 'Done', deadline: new Date('2026-05-10'), project: proj1._id, assignedTo: dev1._id, createdBy: admin._id },
      { title: 'Build REST API endpoints', description: 'Implement CRUD endpoints for all resources with pagination', priority: 'High', status: 'In Progress', deadline: new Date('2026-05-20'), project: proj1._id, assignedTo: dev1._id, createdBy: admin._id },
      { title: 'Implement payment gateway', description: 'Integrate Razorpay for checkout flow', priority: 'High', status: 'Todo', deadline: new Date('2026-06-01'), project: proj1._id, assignedTo: manager._id, createdBy: admin._id },
      { title: 'Product listing frontend', description: 'Build product grid with search and filters', priority: 'Medium', status: 'Todo', deadline: new Date('2026-05-25'), project: proj1._id, assignedTo: dev1._id, createdBy: manager._id },
      { title: 'JWT authentication', description: 'Implement login, register, token refresh', priority: 'High', status: 'Done', deadline: new Date('2026-05-05'), project: proj1._id, assignedTo: dev1._id, createdBy: admin._id },
      { title: 'Shopping cart logic', description: 'Cart CRUD with session persistence', priority: 'Medium', status: 'In Progress', deadline: new Date('2026-05-28'), project: proj1._id, assignedTo: dev1._id, createdBy: manager._id },

      // Project 2 tasks
      { title: 'Data pipeline setup', description: 'Set up ETL pipeline for analytics ingestion', priority: 'High', status: 'In Progress', deadline: new Date('2026-05-01'), project: proj2._id, assignedTo: dev2._id, createdBy: manager._id },
      { title: 'Recharts integration', description: 'Build reusable chart component library', priority: 'Medium', status: 'Todo', deadline: new Date('2026-05-08'), project: proj2._id, assignedTo: dev2._id, createdBy: manager._id },
      { title: 'Report export (PDF/CSV)', description: 'Add export functionality to all reports', priority: 'Low', status: 'Todo', deadline: new Date('2026-05-12'), project: proj2._id, assignedTo: admin._id, createdBy: manager._id },

      // Project 3 tasks
      { title: 'React Navigation setup', description: 'Configure tab and stack navigators', priority: 'Low', status: 'Done', deadline: new Date('2026-06-15'), project: proj3._id, assignedTo: dev1._id, createdBy: admin._id },
      { title: 'Offline sync mechanism', description: 'Local storage with background sync queue', priority: 'High', status: 'Todo', deadline: new Date('2026-07-20'), project: proj3._id, assignedTo: dev2._id, createdBy: admin._id },
      { title: 'Push notifications', description: 'FCM integration for task alerts', priority: 'Medium', status: 'Todo', deadline: new Date('2026-07-30'), project: proj3._id, assignedTo: dev1._id, createdBy: admin._id },
    ];

    const tasks = await Task.insertMany(taskData);
    console.log(`✅ Created ${tasks.length} tasks`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Admin    → admin@erp.com      / admin123');
    console.log('   Manager  → manager@erp.com    / manager123');
    console.log('   Dev 1    → dev@erp.com        / dev123');
    console.log('   Dev 2    → sneha@erp.com      / sneha123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    console.error('❌ Seeder error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected\n');
    process.exit(0);
  }
};

seed();
