// debug-conn.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function testConnection() {
  const url = process.env.DATABASE_URL;
  console.log('Connecting to:', url.replace(/:[^:@]+@/, ':****@'));
  
  try {
    const connection = await mysql.createConnection(url);
    console.log('SUCCESS: Connected to MySQL!');
    
    const [rows] = await connection.execute('SELECT DATABASE() as db');
    console.log('Current Database:', rows[0].db);
    
    const [showDbs] = await connection.execute('SHOW DATABASES');
    console.log('Available Databases:', showDbs.map(d => d.Database).join(', '));
    
    await connection.end();
  } catch (error) {
    console.error('ERROR: Connection failed');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\nDIAGNOSIS: Access Denied. This usually means the username or password is incorrect.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\nDIAGNOSIS: Database name not found. Check your database name in the URL.');
    }
  }
}

testConnection();
