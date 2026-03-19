const mysql = require('mysql2');
require('dotenv').config();

// MySQL Connection Pool එක හදමු
const pool = mysql.createPool({
  host: process.env.DB_HOST,      // RDS Endpoint එක
  user: process.env.DB_USER,      // admin
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,  // fintran
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,            // එකපාරට connections 10ක් handle කරන්න පුළුවන්
  queueLimit: 0
});

// Async/Await විදියට පාවිච්චි කරන්න ලේසි වෙන්න මේක කරමු
const db = pool.promise();

// Connection එක වැඩද කියලා පොඩි check එකක් දාමු (Server එක පටන් ගනිද්දීම)
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection එකේ අවුලක්:', err.message);
  } else {
    console.log('✅ AWS RDS MySQL එකට සාර්ථකව සම්බන්ධ වුණා!');
    connection.release();
  }
});

module.exports = db;