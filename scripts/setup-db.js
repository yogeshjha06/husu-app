#!/usr/bin/env node

/**
 * HUSU MongoDB Setup - Creates collections and indexes
 * Run: node scripts/setup-db.js
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db';
const DB_NAME = 'husu-db';

async function setupDatabase() {
  console.log('\n' + '='.repeat(50));
  console.log('HUSU MongoDB Setup - Starting');
  console.log('='.repeat(50) + '\n');

  const client = new MongoClient(MONGO_URI);

  try {
    console.log('📦 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    // Drop existing collections
    console.log('📝 Cleaning up existing collections...');
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).drop().catch(() => {});
    }
    console.log('✅ Cleaned up collections\n');

    // Create collections with schema validation
    console.log('📝 Creating collections...');

    // Organizations Collection
    await db.createCollection('organizations', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name'],
          properties: {
            _id: { bsonType: 'objectId' },
            name: { bsonType: 'string', description: 'Organization name' },
            logo_url: { bsonType: 'string' },
            admin_id: { bsonType: 'objectId' },
            employee_count: { bsonType: 'int' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' },
          },
        },
      },
    });
    await db.collection('organizations').createIndex({ name: 1 });
    console.log('  ✅ organizations');

    // Users Collection
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'role'],
          properties: {
            _id: { bsonType: 'objectId' },
            email: { bsonType: 'string', description: 'Unique email' },
            first_name: { bsonType: 'string' },
            last_name: { bsonType: 'string' },
            role: {
              enum: ['HUSU_OWNER', 'ORG_ADMIN', 'EMPLOYEE'],
              description: 'User role',
            },
            org_id: { bsonType: ['objectId', 'null'] },
            is_active: { bsonType: 'bool' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' },
          },
        },
      },
    });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ org_id: 1 });
    console.log('  ✅ users');

    // Questions Collection
    await db.createCollection('questions', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['title', 'type', 'created_by'],
          properties: {
            _id: { bsonType: 'objectId' },
            title: { bsonType: 'string' },
            type: {
              enum: ['MCQ', 'TRUE_FALSE', 'MULTI_OPTION', 'SUBJECTIVE', 'RATING', 'IMAGE_MCQ'],
            },
            description: { bsonType: 'string' },
            options: { bsonType: 'array', items: { bsonType: 'string' } },
            correct_answer: { bsonType: 'string' },
            created_by: { bsonType: 'objectId' },
            is_active: { bsonType: 'bool' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' },
          },
        },
      },
    });
    await db.collection('questions').createIndex({ created_by: 1 });
    await db.collection('questions').createIndex({ type: 1 });
    console.log('  ✅ questions');

    // Forms Collection
    await db.createCollection('forms', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'type', 'created_by'],
          properties: {
            _id: { bsonType: 'objectId' },
            name: { bsonType: 'string' },
            type: { enum: ['SINGLE_PAGE', 'INTERACTIVE'] },
            description: { bsonType: 'string' },
            status: { enum: ['ACTIVE', 'INACTIVE'] },
            instructions: { bsonType: 'string' },
            time_limit_minutes: { bsonType: 'int' },
            question_ids: { bsonType: 'array', items: { bsonType: 'objectId' } },
            is_published: { bsonType: 'bool' },
            is_active: { bsonType: 'bool' },
            created_by: { bsonType: 'objectId' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' },
          },
        },
      },
    });
    await db.collection('forms').createIndex({ created_by: 1 });
    await db.collection('forms').createIndex({ status: 1 });
    console.log('  ✅ forms');

    // Form Assignments Collection
    await db.createCollection('form_assignments', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['form_id', 'assigned_to'],
          properties: {
            _id: { bsonType: 'objectId' },
            form_id: { bsonType: 'objectId' },
            assigned_to: { bsonType: 'objectId' },
            org_id: { bsonType: ['objectId', 'null'] },
            status: { enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
            assigned_date: { bsonType: 'date' },
            due_date: { bsonType: 'date' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' },
          },
        },
      },
    });
    await db.collection('form_assignments').createIndex({ form_id: 1 });
    await db.collection('form_assignments').createIndex({ assigned_to: 1 });
    console.log('  ✅ form_assignments');

    // Form Responses Collection
    await db.createCollection('form_responses', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['form_id', 'user_id'],
          properties: {
            _id: { bsonType: 'objectId' },
            form_id: { bsonType: 'objectId' },
            user_id: { bsonType: 'objectId' },
            status: { enum: ['PENDING', 'IN_PROGRESS', 'SUBMITTED'] },
            answers: { bsonType: 'array' },
            progress_percentage: { bsonType: 'int' },
            time_spent_seconds: { bsonType: 'int' },
            started_at: { bsonType: 'date' },
            submitted_at: { bsonType: 'date' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' },
          },
        },
      },
    });
    await db.collection('form_responses').createIndex({ form_id: 1 });
    await db.collection('form_responses').createIndex({ user_id: 1 });
    console.log('  ✅ form_responses');

    // Subscriptions Collection
    await db.createCollection('subscriptions', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['org_id'],
          properties: {
            _id: { bsonType: 'objectId' },
            org_id: { bsonType: 'objectId' },
            status: { enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'] },
            start_date: { bsonType: 'date' },
            end_date: { bsonType: 'date' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' },
          },
        },
      },
    });
    await db.collection('subscriptions').createIndex({ org_id: 1 });
    console.log('  ✅ subscriptions');

    // Reports Collection
    await db.createCollection('reports', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          properties: {
            _id: { bsonType: 'objectId' },
            form_id: { bsonType: 'objectId' },
            title: { bsonType: 'string' },
            response_count: { bsonType: 'int' },
            completion_rate: { bsonType: 'double' },
            created_by: { bsonType: 'objectId' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' },
          },
        },
      },
    });
    await db.collection('reports').createIndex({ form_id: 1 });
    console.log('  ✅ reports');

    // Resources Collection
    await db.createCollection('resources', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          properties: {
            _id: { bsonType: 'objectId' },
            title: { bsonType: 'string' },
            category: { bsonType: 'string' },
            url: { bsonType: 'string' },
            usage_count: { bsonType: 'int' },
            created_by: { bsonType: 'objectId' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' },
          },
        },
      },
    });
    await db.collection('resources').createIndex({ category: 1 });
    console.log('  ✅ resources');

    console.log('\n✨ MongoDB setup completed successfully!\n');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupDatabase();
