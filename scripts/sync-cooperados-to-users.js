// @ts-nocheck
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// 1. Load env before anything else
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// 2. Import DB after env is loaded
const { db } = require('../lib/db');
const { users } = require('../lib/db/schema/users');
const { cooperados } = require('../lib/db/schema/cooperados');
const { eq } = require('drizzle-orm');

async function sync() {
  console.log('🔄 Starting synchronization: Cooperados -> Users');
  
  if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env.local');
      process.exit(1);
  }

  try {
    // 1. Get all cooperados
    const allCooperados = await db.select().from(cooperados);
    console.log(`Found ${allCooperados.length} cooperados in the database.`);

    // 2. Get all existing users to avoid double creation
    const allUsers = await db.select().from(users);
    const userEmails = new Set(allUsers.map(u => u.email.toLowerCase()));
    console.log(`Found ${allUsers.length} existing users.`);

    let createdCount = 0;
    let linkedCount = 0;
    let skippedCount = 0;

    for (const coop of allCooperados) {
      if (!coop.email) {
        console.warn(`⚠️ Cooperado ${coop.name} (ID: ${coop.id}) has no email. Skipping.`);
        skippedCount++;
        continue;
      }

      const emailLower = coop.email.toLowerCase();
      let userId = coop.userId;

      // Check if user already exists for this email
      if (!userEmails.has(emailLower)) {
        // Create new user
        // Password is the matricula (registration number)
        const passwordHash = await bcrypt.hash(coop.matricula || '123456', 10);
        
        try {
          const [newUser] = await db.insert(users).values({
            name: coop.name,
            email: emailLower,
            passwordHash,
            role: 'user',
            registrationNumber: coop.matricula,
            cpf: coop.cpf,
            phone: coop.phone,
            isActive: true
          }).returning();
          
          userId = newUser.id;
          userEmails.add(emailLower);
          createdCount++;
        } catch (e) {
          console.error(`❌ Error creating user for ${coop.name}:`, e.message);
          skippedCount++;
          continue;
        }
      } else if (!userId) {
        // User exists but is not linked to cooperado
        const existingUser = allUsers.find(u => u.email.toLowerCase() === emailLower);
        if (existingUser) {
          userId = existingUser.id;
        }
      }

      // Link user to cooperado if not linked
      if (userId && coop.userId !== userId) {
        await db.update(cooperados)
          .set({ userId })
          .where(eq(cooperados.id, coop.id));
        linkedCount++;
      } else {
        skippedCount++;
      }

      if ((createdCount + linkedCount) % 50 === 0 && (createdCount + linkedCount) > 0) {
        console.log(`Processed ${createdCount + linkedCount} updates...`);
      }
    }

    console.log('\n--- Sync Result ---');
    console.log(`Total Cooperados: ${allCooperados.length}`);
    console.log(`Users Created: ${createdCount}`);
    console.log(`Cooperados Linked: ${linkedCount}`);
    console.log(`Skipped/Already Set: ${skippedCount}`);
    
    // Final Verification
    const finalCooperados = await db.select().from(cooperados);
    const linked = finalCooperados.filter(c => c.userId).length;
    console.log(`\nFinal Verification: ${linked} out of ${finalCooperados.length} cooperados are now linked to a user.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

sync();
