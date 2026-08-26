require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (_) {}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user.model');
const Category = require('./models/category.model');
const Event = require('./models/event.model');
const Registration = require('./models/registration.model');
const Message = require('./models/message.model');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Delete in correct order to respect references
    await Message.deleteMany();
    console.log('Messages cleared');
    await Registration.deleteMany();
    console.log('Registrations cleared');
    await Event.deleteMany();
    console.log('Events cleared');
    await Category.deleteMany();
    console.log('Categories cleared');
    await User.deleteMany();
    console.log('Users cleared');

    // 1. Create categories (at least 3)
    const categories = await Category.insertMany([
      { name: 'Music', description: 'Music events and concerts' },
      { name: 'Tech', description: 'Technology conferences and workshops' },
      { name: 'Sports', description: 'Sports tournaments and meetups' },
      { name: 'Business', description: 'Business and career events' },
    ]);
    console.log(`Created ${categories.length} categories`);
    const [musicCat, techCat, sportsCat, businessCat] = categories;

    // 2. Create users (at least 1 admin you can login)
    const hashedAdminPassword = await bcrypt.hash('Admin123!', 12);
    const hashedUserPassword = await bcrypt.hash('User123!', 12);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@eventpulse.com',
      password: hashedAdminPassword,
      role: 'admin',
    });
    console.log(`Created admin: ${admin.email} / Admin123!`);

    const attendee1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedUserPassword,
      role: 'attendee',
    });
    const attendee2 = await User.create({
      name: 'Sara Ahmed',
      email: 'sara@example.com',
      password: hashedUserPassword,
      role: 'attendee',
    });
    console.log(`Created attendees: ${attendee1.email}, ${attendee2.email}`);

    // 3. Create events (at least 4 across categories)
    const events = await Event.insertMany([
      {
        title: 'Tech Conference 2024',
        description: 'A premier tech conference covering AI, web development, and cloud computing. Join workshops and networking.',
        category: techCat._id,
        date: new Date('2024-12-20'),
        city: 'Cairo',
        venue: 'Cairo International Conference Center',
        capacity: 150,
        organizer: admin._id,
      },
      {
        title: 'Summer Music Festival',
        description: 'Enjoy live music performances from top artists. A must-attend music concert in the heart of the city.',
        category: musicCat._id,
        date: new Date('2024-08-15'),
        city: 'Cairo',
        venue: 'Al Azhar Park',
        capacity: 500,
        organizer: admin._id,
      },
      {
        title: 'Frontend Workshop',
        description: 'Hands-on frontend workshop covering React, Vue, and modern tooling. Perfect for developers.',
        category: techCat._id,
        date: new Date('2024-09-10'),
        city: 'Alexandria',
        venue: 'Bibliotheca Alexandrina',
        capacity: 50,
        organizer: admin._id,
      },
      {
        title: 'Career Fair',
        description: 'Meet top employers and explore career opportunities. Business networking event.',
        category: businessCat._id,
        date: new Date('2024-11-05'),
        city: 'New York',
        venue: 'Javits Center',
        capacity: 300,
        organizer: admin._id,
      },
      {
        title: 'Football Championship',
        description: 'Annual sports championship featuring local and international teams.',
        category: sportsCat._id,
        date: new Date('2024-10-12'),
        city: 'London',
        venue: 'Wembley Stadium',
        capacity: 2,
        organizer: admin._id,
      },
    ]);
    console.log(`Created ${events.length} events`);

    // 4. Create sample registrations (optional but useful)
    const sampleRegistrations = await Registration.insertMany([
      { event: events[0]._id, attendee: attendee1._id },
      { event: events[1]._id, attendee: attendee1._id },
      { event: events[0]._id, attendee: attendee2._id },
    ]);
    console.log(`Created ${sampleRegistrations.length} registrations`);

    // 5. Create sample messages (announcements)
    const sampleMessages = await Message.insertMany([
      { event: events[0]._id, sender: admin._id, text: 'Welcome everyone! The event will start in 10 minutes.' },
      { event: events[0]._id, sender: admin._id, text: 'Session A is now starting in Hall 1' },
      { event: events[1]._id, sender: admin._id, text: 'Doors open at 6 PM. See you there!' },
    ]);
    console.log(`Created ${sampleMessages.length} messages`);

    console.log('\nSeed completed successfully!');
    console.log('Login credentials:');
    console.log('  Admin -> admin@eventpulse.com / Admin123!');
    console.log('  Attendee -> sara@example.com / User123!');
    console.log('  Attendee -> john@example.com / User123!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
