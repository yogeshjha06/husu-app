#!/usr/bin/env node

/**
 * HUSU MongoDB Seed Script - Creates test users and organizations
 * Run: node scripts/seed-users.js
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db';
const DB_NAME = 'husu-db';

async function seedDatabase() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🚀 Starting HUSU Database Seeding...\n');

    await client.connect();
    const db = client.db(DB_NAME);

    // Create test organization
    console.log('📋 Creating test organization...');
    const orgResult = await db.collection('organizations').insertOne({
      name: 'Accenture India',
      employee_count: 150,
      created_at: new Date(),
      updated_at: new Date(),
    });
    const orgId = orgResult.insertedId;
    console.log(`✅ Organization created: Accenture India\n`);

    // Create HUSU Owner user
    console.log('👤 Creating HUSU Owner account...');
    const husuOwnerResult = await db.collection('users').insertOne({
      email: 'admin@husu.com',
      first_name: 'Yogesh',
      last_name: 'Jha',
      role: 'HUSU_OWNER',
      org_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log(`✅ HUSU Owner Created`);
    console.log(`   Email: admin@husu.com`);
    console.log(`   Password: HusuAdmin@2024\n`);

    // Create Organization Admin user
    console.log('👤 Creating Organisation Admin account...');
    const orgAdminResult = await db.collection('users').insertOne({
      email: 'rajesh@accenture.com',
      first_name: 'Rajesh',
      last_name: 'Kumar',
      role: 'ORG_ADMIN',
      org_id: orgId,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log(`✅ Organisation Admin Created`);
    console.log(`   Email: rajesh@accenture.com`);
    console.log(`   Password: OrgAdmin@2024`);
    console.log(`   Organization: Accenture India\n`);

    // Create Employee users
    console.log('👤 Creating Employee accounts...');
    const employeeData = [
      { email: 'john.doe@accenture.com', first: 'John', last: 'Doe' },
      { email: 'priya.sharma@accenture.com', first: 'Priya', last: 'Sharma' },
    ];

    const employees = [];
    for (const emp of employeeData) {
      const result = await db.collection('users').insertOne({
        email: emp.email,
        first_name: emp.first,
        last_name: emp.last,
        role: 'EMPLOYEE',
        org_id: orgId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      employees.push({ id: result.insertedId, email: emp.email });
    }

    employees.forEach((emp, idx) => {
      console.log(`   ${idx + 1}. ${emp.email} (Password: Employee@2024)`);
    });

    // Create subscription for the organization
    console.log('\n📋 Creating subscription...');
    await db.collection('subscriptions').insertOne({
      org_id: orgId,
      status: 'ACTIVE',
      start_date: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log('✅ Subscription created\n');

    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         HUSU PLATFORM - TEST CREDENTIALS                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔐 HUSU OWNER LOGIN (Secret Page: /login/husu)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Email: admin@husu.com');
    console.log('   Password: HusuAdmin@2024');
    console.log('   Role: HUSU Owner');
    console.log('   Features: Full admin access, manage all orgs, create forms\n');

    console.log('🏢 ORGANISATION ADMIN LOGIN (Public Page: /login)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Email: rajesh@accenture.com');
    console.log('   Password: OrgAdmin@2024');
    console.log('   Organization: Accenture India');
    console.log('   Role: Org Admin');
    console.log('   Features: View KPIs, reports, benchmarks, resources\n');

    console.log('👨‍💼 EMPLOYEE LOGIN (Public Page: /login)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Credential 1:');
    console.log('     Email: john.doe@accenture.com');
    console.log('     Password: Employee@2024\n');
    console.log('   Credential 2:');
    console.log('     Email: priya.sharma@accenture.com');
    console.log('     Password: Employee@2024\n');
    console.log('   Features: Complete surveys, view certificates, track tasks\n');

    console.log('════════════════════════════════════════════════════════════════\n');

    console.log('✨ Database seeding completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedDatabase();
