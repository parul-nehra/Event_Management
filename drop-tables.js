import mysql from 'mysql2/promise';
import 'dotenv/config';

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    try {
        const [rows] = await connection.execute('SHOW TABLES');
        if (rows.length > 0) {
            console.log('Dropping tables...');
            await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
            for (const row of rows) {
                const tableName = Object.values(row)[0];
                await connection.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
                console.log(`Dropped ${tableName}`);
            }
            await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        } else {
            console.log('No tables to drop.');
        }
    } catch (error) {
        console.error('Error dropping tables:', error);
    } finally {
        await connection.end();
    }
}

main();
