import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { hashPassword } from './utils/auth.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
const prisma = new PrismaClient();
const TEAMS = [
    { name: 'CSK', username: 'csk' },
    { name: 'MI', username: 'mi' },
    { name: 'RCB', username: 'rcb' },
    { name: 'KKR', username: 'kkr' },
    { name: 'SRH', username: 'srh' },
    { name: 'GT', username: 'gt' },
    { name: 'DC', username: 'dc' },
];
const INITIAL_BUDGET = 100.0;
async function seedUsers() {
    console.log('Seeding users...');
    const managerPassword = await hashPassword('manager123');
    const manager = await prisma.user.upsert({
        where: { username: 'manager' },
        update: {},
        create: {
            username: 'manager',
            passwordHash: managerPassword,
            role: 'MANAGER',
        },
    });
    console.log('✓ Manager user created:', manager.username);
    const teamPassword = await hashPassword('team123');
    for (const teamData of TEAMS) {
        const team = await prisma.team.upsert({
            where: { name: teamData.name },
            update: {},
            create: {
                name: teamData.name,
                initialBudget: INITIAL_BUDGET,
                remainingBudget: INITIAL_BUDGET,
            },
        });
        await prisma.user.upsert({
            where: { username: teamData.username },
            update: {},
            create: {
                username: teamData.username,
                passwordHash: teamPassword,
                role: 'TEAM',
                teamId: team.id,
            },
        });
        console.log(`✓ Team created: ${team.name} (username: ${teamData.username})`);
    }
}
async function seedPlayers() {
    console.log('\nSeeding players from Excel...');
    const excelPath = join(process.cwd(), '..', 'data', 'players.xlsx');
    if (!existsSync(excelPath)) {
        console.log('⚠ Excel file not found at:', excelPath);
        console.log('Skipping player import. Place your players.xlsx file in the data/ directory.');
        return;
    }
    const fileBuffer = readFileSync(excelPath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    let importedCount = 0;
    for (const row of data) {
        try {
            await prisma.player.create({
                data: {
                    name: row.Player || row.player || '',
                    age: parseInt(row.Age || row.age || '0'),
                    role: row.Type || row.type || 'All-Rounder',
                    matches: parseInt(row.Matches || row.matches || '0'),
                    runs: parseInt(row.Runs || row.runs || '0'),
                    fifties: parseInt(row['50s'] || row.fifties || '0'),
                    hundreds: parseInt(row['100s'] || row.hundreds || '0'),
                    strikeRate: parseFloat(row.SR || row.strikeRate || row.strike_rate || '0'),
                    wickets: parseInt(row.Wickets || row.wickets || '0'),
                    economy: parseFloat(row.Economy || row.economy || '0'),
                    basePrice: parseFloat(row.BasePrice || row.basePrice || row.base_price || '1.0'),
                    status: 'UNSOLD',
                },
            });
            importedCount++;
        }
        catch (error) {
            console.error(`Error importing player ${row.Player}:`, error);
        }
    }
    console.log(`✓ Imported ${importedCount} players from Excel`);
}
async function main() {
    console.log('Starting database seed...\n');
    await seedUsers();
    await seedPlayers();
    console.log('\n✓ Database seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Manager: username=manager, password=manager123');
    console.log('Teams: username=csk/mi/rcb/kkr/srh/gt/dc, password=team123');
}
main()
    .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map