import mongoose from 'mongoose';

const mongoURI = 'mongodb+srv://skhaswin_db_user:haswin8098@cluster0.gizobl9.mongodb.net/vibechat?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI).then(async () => {
  try {
    const db = mongoose.connection.db;
    const result = await db.collection('users').updateOne(
      { email: 'sk@gmail.com' }, 
      { $set: { isAdmin: true } }
    );
    console.log('✅ Update successful!');
    console.log('Matched Count:', result.matchedCount);
    console.log('Modified Count:', result.modifiedCount);
    
    if (result.modifiedCount > 0) {
      console.log('✅ sk@gmail.com is now an admin!');
    } else if (result.matchedCount > 0) {
      console.log('⚠️ User already had isAdmin set');
    } else {
      console.log('❌ sk@gmail.com user not found');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Connection Error:', err.message);
  process.exit(1);
});
