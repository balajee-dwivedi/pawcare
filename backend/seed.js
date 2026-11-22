import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { Volunteer } from './models/Volunteer.js';
import { Shelter } from './models/Shelter.js';
import { AnimalReport } from './models/AnimalReport.js';
import { Adoption } from './models/Adoption.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, '.env') });

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in backend/.env');
  await mongoose.connect(uri);
  console.log('MongoDB connected for seeding.');
}

async function getOrCreateUser(details, passwordHash) {
  let user = await User.findOne({ email: details.email });
  if (!user) user = await User.create({ ...details, password: passwordHash });
  return user;
}

async function seed() {
  await connect();
  const passwordHash = await bcrypt.hash('PawCare123!', 12);

  const admin = await getOrCreateUser(
    {
      name: 'PawCare Admin',
      email: 'admin@pawcare.local',
      phone: '+91 90000 00001',
      role: 'admin',
    },
    passwordHash
  );

  const volunteerUsers = await Promise.all([
    getOrCreateUser(
      {
        name: 'Asha Sharma',
        email: 'volunteer1@pawcare.local',
        phone: '+91 90000 00011',
        role: 'volunteer',
      },
      passwordHash
    ),
    getOrCreateUser(
      {
        name: 'Kabir Rao',
        email: 'volunteer2@pawcare.local',
        phone: '+91 90000 00012',
        role: 'volunteer',
      },
      passwordHash
    ),
  ]);

  const shelterSeeds = [
    {
      name: 'Green Paws Rescue',
      address: '12 Park Lane, Bengaluru',
      phone: '+91 90000 00101',
      email: 'hello@greenpaws.example',
      description: 'A neighborhood rescue team providing temporary care and adoption support.',
      location: { lat: 12.9716, lng: 77.5946, address: 'Bengaluru, Karnataka' },
    },
    {
      name: 'Second Chance Animal Home',
      address: '8 Lake Road, Pune',
      phone: '+91 90000 00102',
      email: 'care@secondchance.example',
      description: 'A compassionate shelter focused on recovery, foster care, and family matching.',
      location: { lat: 18.5204, lng: 73.8567, address: 'Pune, Maharashtra' },
    },
  ];

  const shelters = [];
  for (const seedItem of shelterSeeds) {
    const shelter = await Shelter.findOneAndUpdate(
      { name: seedItem.name },
      { $setOnInsert: seedItem },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    shelters.push(shelter);
  }

  const shelterUsers = await Promise.all([
    getOrCreateUser(
      {
        name: 'Green Paws Team',
        email: 'shelter1@pawcare.local',
        phone: shelterSeeds[0].phone,
        role: 'shelter',
        shelterId: shelters[0]._id,
      },
      passwordHash
    ),
    getOrCreateUser(
      {
        name: 'Second Chance Team',
        email: 'shelter2@pawcare.local',
        phone: shelterSeeds[1].phone,
        role: 'shelter',
        shelterId: shelters[1]._id,
      },
      passwordHash
    ),
  ]);

  for (const user of volunteerUsers) {
    await Volunteer.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          name: user.name,
          contact: user.phone,
          area: user.email.includes('1@') ? 'Bengaluru Central' : 'Pune West',
          availability: 'available',
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  const reports = [
    {
      animalType: 'Dog',
      description: 'Seed case: a limping dog near the park entrance needs urgent assessment.',
      assistanceRequired: 'Rescue transport and a veterinary check',
      priority: 'Emergency',
      location: { lat: 12.9762, lng: 77.5993, address: 'Cubbon Park, Bengaluru' },
    },
    {
      animalType: 'Cat',
      description: 'Seed case: a young cat is resting under a bench and appears weak.',
      assistanceRequired: 'Food, water, and a health check',
      priority: 'Urgent',
      location: { lat: 12.9698, lng: 77.6012, address: 'MG Road, Bengaluru' },
    },
    {
      animalType: 'Dog',
      description: 'Seed case: a friendly stray needs a dry place during heavy rain.',
      assistanceRequired: 'Temporary shelter and food',
      priority: 'Normal',
      location: { lat: 18.525, lng: 73.856, address: 'Deccan, Pune' },
    },
    {
      animalType: 'Puppy',
      description: 'Seed case: two puppies are beside a busy road; one is hiding nearby.',
      assistanceRequired: 'Safe pickup and temporary foster care',
      priority: 'Urgent',
      location: { lat: 18.516, lng: 73.84, address: 'Shivajinagar, Pune' },
    },
    {
      animalType: 'Cow',
      description: 'Seed case: a calm cow is near the market with a small scrape.',
      assistanceRequired: 'Animal welfare check and clean water',
      priority: 'Normal',
      location: { lat: 12.958, lng: 77.577, address: 'Jayanagar, Bengaluru' },
    },
  ];

  for (const [index, item] of reports.entries()) {
    await AnimalReport.findOneAndUpdate(
      { description: item.description },
      {
        $setOnInsert: {
          ...item,
          date: new Date(Date.now() - index * 45 * 60_000),
          status: 'Pending',
          verified: true,
          reporterId: admin._id,
          assignedVolunteerId: null,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  const animals = [
    {
      animalType: 'Indie dog',
      age: '8 months',
      gender: 'Female',
      description: 'Playful, gentle and happiest on a long evening walk.',
      shelter: 0,
    },
    {
      animalType: 'Tabby cat',
      age: '1 year',
      gender: 'Male',
      description: 'A curious window-watcher who enjoys a quiet lap.',
      shelter: 0,
    },
    {
      animalType: 'Indie puppy',
      age: '4 months',
      gender: 'Male',
      description: 'Bright-eyed, learning leash manners, and ready for a patient home.',
      shelter: 1,
    },
    {
      animalType: 'Calico cat',
      age: '2 years',
      gender: 'Female',
      description: 'Independent, affectionate, and fully comfortable indoors.',
      shelter: 1,
    },
    {
      animalType: 'Indie dog',
      age: '3 years',
      gender: 'Female',
      description: 'Calm and loyal, with a soft spot for children and sunny courtyards.',
      shelter: 0,
    },
  ];

  for (const item of animals) {
    await Adoption.findOneAndUpdate(
      { animalType: item.animalType, age: item.age, shelterId: shelters[item.shelter]._id },
      {
        $setOnInsert: {
          animalType: item.animalType,
          age: item.age,
          gender: item.gender,
          description: item.description,
          photo: '',
          shelterId: shelters[item.shelter]._id,
          adoptionStatus: 'Available',
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  console.log(
    'Seed complete: 1 admin, 2 volunteers, 2 shelters, 5 rescue reports, and 5 adoption listings.'
  );
  console.log('Demo password for the seeded accounts: PawCare123!');
}

seed()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });