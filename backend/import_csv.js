const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseAmount(amtStr) {
  if (!amtStr) return 0;
  return parseFloat(amtStr.replace(/,/g, ''));
}

async function run() {
  const filePath = 'C:/Users/Jaskirat/Downloads/Expenses Export.csv';
  const results = [];
  const anomalies = [];
  
  await new Promise((resolve) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve);
  });

  // 1. Create main user
  const email = 'jaskirat@gmail.com';
  const pass = 'Jas@2306';
  let jaskirat = await prisma.user.findUnique({ where: { email } });
  if (!jaskirat) {
    jaskirat = await prisma.user.create({
      data: {
        name: 'Jaskirat',
        email,
        password_hash: await bcrypt.hash(pass, 12),
        is_ghost: false
      }
    });
    console.log('Created user jaskirat');
  } else {
    // update password just in case
    await prisma.user.update({
      where: { email },
      data: { password_hash: await bcrypt.hash(pass, 12), is_ghost: false }
    });
    console.log('Updated user jaskirat');
  }

  // 2. Extract unique users
  const userNames = new Set();
  results.forEach(row => {
    if (row.paid_by) userNames.add(row.paid_by.trim());
    if (row.split_with) {
      row.split_with.split(/[,;\/]+/).forEach(n => userNames.add(n.trim()));
    }
  });

  const userMap = {};
  for (const rawName of userNames) {
    if (!rawName) continue;
    // Normalize name to be case-insensitive for lookup to avoid duplicate users (e.g., priya vs Priya vs Priya S)
    const name = rawName; // wait, let's keep exact string but maybe map internally
    const nameNorm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const genEmail = `${nameNorm}@example.com`;
    
    let u = await prisma.user.findFirst({ where: { email: genEmail } });
    if (!u) {
      u = await prisma.user.create({
        data: { name: name, email: genEmail, is_ghost: true }
      });
      console.log('Created ghost user', name);
      anomalies.push(`- **Action Taken**: implicitly created ghost user \`${name}\` (\`${genEmail}\`) as they were not found in the DB.`);
    }
    userMap[rawName] = u;
  }
  userMap['Jaskirat'] = jaskirat;
  userMap['jaskirat'] = jaskirat;

  // 3. Create a Group
  let group = await prisma.group.findFirst({ where: { name: 'Imported Expenses' } });
  if (!group) {
    group = await prisma.group.create({
      data: {
        name: 'Imported Expenses',
        created_by: jaskirat.id,
        base_currency: 'INR'
      }
    });
    console.log('Created group');
  }

  // 4. Add all users to group
  for (const u of Object.values(userMap)) {
    try {
      await prisma.groupMember.create({
        data: { group_id: group.id, user_id: u.id }
      });
    } catch (e) { /* ignore if already member */ }
  }

  // 5. Insert expenses/settlements
  for (const row of results) {
    if (!row.amount) {
      anomalies.push(`- **Anomaly Detected**: Row missing amount (Description: \`${row.description}\`). **Action**: Skipped row.`);
      continue;
    }
    let amount = parseAmount(row.amount);
    const paidBy = row.paid_by ? row.paid_by.trim() : null;
    let stype = (row.split_type || '').toLowerCase().trim();
    
    const splitWithStr = row.split_with ? row.split_with.split(/[,;\/]+/).map(s => s.trim()).filter(s => s) : [];
    
    if (!paidBy || !userMap[paidBy]) continue;

    // Is it a settlement? 
    // In our CSV, settlements have no split_type or empty split_type and usually negative/positive
    if (stype === '') {
      // Settlement
      const paidTo = splitWithStr[0];
      if (paidBy && paidTo && userMap[paidTo]) {
        await prisma.settlement.create({
           data: {
             group_id: group.id,
             paid_by: userMap[paidBy].id,
             paid_to: userMap[paidTo].id,
             amount,
             currency: row.currency || 'INR'
           }
        });
        console.log('Inserted settlement from', paidBy, 'to', paidTo, amount);
        anomalies.push(`- **Anomaly Detected**: Blank split_type in CSV for ${paidBy} → ${paidTo} (${amount}). **Action**: Interpreted as Settlement.`);
      } else {
        anomalies.push(`- **Anomaly Detected**: Incomplete settlement row for ${paidBy}. **Action**: Skipped.`);
      }
      continue;
    }

    const typeMapping = {
      'equal': 'EQUAL',
      'unequal': 'EXACT',
      'share': 'SHARES',
      'percentage': 'PERCENTAGE'
    };
    const dbSplitType = typeMapping[stype] || 'EXACT';
    
    let calculatedSplits = [];
    if (dbSplitType === 'EQUAL') {
      const perPerson = amount / splitWithStr.length;
      calculatedSplits = splitWithStr.map(uName => ({
        user_id: userMap[uName].id,
        owed_amount: perPerson,
        share_value: 0
      }));
    } else if (dbSplitType === 'EXACT') {
      const parts = (row.split_details || '').split(/[,;]+/).map(s => s.trim()).filter(s => s);
      parts.forEach(p => {
        // "Rohan 700" 
        const match = p.match(/(.+?)\s+([\d.]+)/);
        if (match) {
          const uName = match[1].trim();
          const val = parseFloat(match[2]);
          if (userMap[uName]) {
            calculatedSplits.push({ user_id: userMap[uName].id, owed_amount: val, share_value: val });
          }
        }
      });
    } else if (dbSplitType === 'PERCENTAGE') {
      const parts = (row.split_details || '').split(/[,;]+/).map(s => s.trim()).filter(s => s);
      let totalPerc = 0;
      let splitsTemp = [];
      parts.forEach(p => {
        // "Aisha 30%"
        const match = p.match(/(.+?)\s+([\d.]+)%?/);
        if (match) {
          const uName = match[1].trim();
          const val = parseFloat(match[2]);
          totalPerc += val;
          if (userMap[uName]) {
            splitsTemp.push({ user_id: userMap[uName].id, val });
          }
        }
      });
      calculatedSplits = splitsTemp.map(s => ({
        user_id: s.user_id,
        owed_amount: amount * (s.val / totalPerc), // normalize to sum to 100% just in case
        share_value: s.val
      }));
    } else if (dbSplitType === 'SHARES') {
      const parts = (row.split_details || '').split(/[,;]+/).map(s => s.trim()).filter(s => s);
      let totalShares = 0;
      let splitsTemp = [];
      parts.forEach(p => {
        const match = p.match(/(.+?)\s+([\d.]+)/);
        if (match) {
          const uName = match[1].trim();
          const val = parseFloat(match[2]);
          totalShares += val;
          if (userMap[uName]) {
            splitsTemp.push({ user_id: userMap[uName].id, val });
          }
        }
      });
      calculatedSplits = splitsTemp.map(s => ({
        user_id: s.user_id,
        owed_amount: amount * (s.val / totalShares),
        share_value: s.val
      }));
    }

    if (calculatedSplits.length === 0 && splitWithStr.length > 0) {
       // fallback to equal
       anomalies.push(`- **Anomaly Detected**: Failed to calculate valid component splits for \`${row.description}\`. **Action**: Fell back to EQUAL split.`);
       const perPerson = amount / splitWithStr.length;
       calculatedSplits = splitWithStr.map(uName => ({
         user_id: userMap[uName].id,
         owed_amount: perPerson,
         share_value: 0
       }));
    }

    await prisma.expense.create({
      data: {
         group_id: group.id,
         description: row.description || 'Expense',
         total_amount: amount,
         currency: row.currency || 'INR',
         paid_by: userMap[paidBy].id,
         created_by: jaskirat.id,
         split_type: dbSplitType,
         splits: {
           create: calculatedSplits
         }
      }
    });
    console.log('Inserted expense', row.description);
  }

  // 6. Recompute balances using the balanceService
  const { recomputeBalances } = require('./src/services/balanceService');
  await recomputeBalances(group.id);
  console.log('Balances recomputed');

  // 7. Generate Import Report
  const reportContent = `# Import Report

> Auto-generated by \`import_csv.js\` on ${new Date().toISOString()}

### Summary
- Total rows processed: ${results.length}
- Anomalies Log:

${anomalies.length > 0 ? anomalies.join('\n') : '- No anomalies detected!'}

---
*End of Report*
`;
  fs.writeFileSync('C:/Users/Jaskirat/Desktop/import_report.md', reportContent);
  fs.writeFileSync('../import_report.md', reportContent);
  console.log('Import report generated at ../import_report.md');

  console.log('Done');
}

run().catch(console.error).finally(() => prisma.$disconnect());
