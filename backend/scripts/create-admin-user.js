const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[environment]);

async function createAdminUser() {
  try {
    const email = 'admin@cashly.com';
    const username = 'admin';
    const password = 'Admin123!'; // Meets password requirements
    const role = 'admin';
    const walletLimit = 999; // High limit for admin

    // Check if user already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      process.exit(0);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const userId = uuidv4();
    await db('users').insert({
      id: userId,
      username,
      email,
      password_hash: passwordHash,
      role,
      wallet_limit: walletLimit,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log(`Email: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);
    console.log('-----------------------------------');
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
