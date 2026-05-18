const mongoose = require('mongoose');

const mongoURI = "mongodb+srv://haswinsk:2J3x8Cz@cluster0.69bfaa.mongodb.net/vibechat";

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  const db = mongoose.connection.db;
  const result = await db.collection('users').updateOne(
    { email: 'sk@gmail.com' },
    { $set: { isAdmin: true } }
  );
  console.log('✅ Update result:', result);
  if (result.modifiedCount > 0) {
    console.log('✅ sk@gmail.com is now an admin!');
  } else if (result.matchedCount > 0) {
    console.log('⚠️  User found but already had isAdmin set');
  } else {
    console.log('❌ User sk@gmail.com not found');
  }
  process.exit(0);
})
.catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
