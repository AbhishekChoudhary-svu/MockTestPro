const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Read MONGODB_URI from .env file
const envPath = path.join(__dirname, '.env');
let MONGODB_URI;

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('MONGODB_URI=')) {
      MONGODB_URI = line.split('MONGODB_URI=')[1].trim().replace(/['"]/g, '');
      break;
    }
  }
} catch (err) {
  console.error("Could not read .env file:", err);
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env");
  process.exit(1);
}

console.log("Connecting to MongoDB...");

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected successfully.");
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    
    console.log("\n--- Existing Users ---");
    users.forEach(u => {
      console.log(`ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
    });
    console.log("----------------------\n");
    
    mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
