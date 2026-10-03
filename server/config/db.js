const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    const isAtlas = process.env.MONGO_URI?.startsWith('mongodb+srv://');
    console.log(`MongoDB Connected: ${conn.connection.host} (${isAtlas ? 'Atlas' : 'local'})`);
    await cleanupStaleIndexes(conn);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error('Check MONGO_URI in server/.env — for Atlas, copy the exact string from');
    console.error('Atlas Dashboard > Database > Connect > Drivers > Node.js, and make sure');
    console.error('your current IP is allow-listed under Network Access in Atlas.');
    process.exit(1);
  }
};

// One-time self-healing cleanup for stale unique indexes left over from
// earlier versions of a schema. Mongoose only creates indexes it knows
// about from the current schema — it never drops indexes that used to
// exist but aren't declared anymore. Left in place, a stale unique index
// on a field nothing sets anymore rejects every document after the very
// first one with "E11000 duplicate key ... <field>: null", since every
// document has the same (missing) value for that field.
//
// Known cases so far: Loan (loanNumber) and Order (orderNumber) both had
// this field in an earlier schema version; neither model declares it now.
const STALE_INDEX_FIELDS = {
  loans: 'loanNumber',
  orders: 'orderNumber',
};

const cleanupStaleIndexes = async (conn) => {
  for (const [collectionName, field] of Object.entries(STALE_INDEX_FIELDS)) {
    try {
      const collections = await conn.connection.db.listCollections({ name: collectionName }).toArray();
      if (collections.length === 0) continue; // collection doesn't exist yet — nothing to clean

      const indexes = await conn.connection.db.collection(collectionName).indexes();
      const staleIndex = indexes.find((idx) => Object.prototype.hasOwnProperty.call(idx.key, field));
      if (staleIndex) {
        await conn.connection.db.collection(collectionName).dropIndex(staleIndex.name);
        console.log(`🧹 Dropped stale index "${staleIndex.name}" on ${collectionName}.${field} (leftover from an older schema version).`);
      }
    } catch (error) {
      // Non-fatal — don't block server startup over an index cleanup check.
      console.error(`Index cleanup check failed for ${collectionName} (non-fatal):`, error.message);
    }
  }
};

module.exports = connectDB;
