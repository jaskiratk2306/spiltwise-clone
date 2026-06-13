// backend/src/services/balanceService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recomputeBalances(groupId = null, userPair = null) {
  // If groupId is null and userPair is provided, we are in 1-on-1 context
  // Otherwise we are in group context
  
  const where = groupId 
    ? { group_id: groupId, deleted_at: null }
    : { group_id: null, deleted_at: null, OR: [
        { paid_by: userPair[0], splits: { some: { user_id: userPair[1] } } },
        { paid_by: userPair[1], splits: { some: { user_id: userPair[0] } } }
      ]};

  const expenses = await prisma.expense.findMany({
    where,
    include: { splits: true }
  });

  const settlements = await prisma.settlement.findMany({
    where: groupId ? { group_id: groupId } : { group_id: null, OR: [
      { paid_by: userPair[0], paid_to: userPair[1] },
      { paid_by: userPair[1], paid_to: userPair[0] }
    ]}
  });

  // rawBalances[owes][isOwed] = amount
  const rawBalances = {};

  expenses.forEach(exp => {
    const payerId = exp.paid_by;
    exp.splits.forEach(split => {
      if (split.user_id !== payerId) {
        const ower = split.user_id;
        const owerOwesPayer = split.owed_amount * exp.conversion_rate;
        
        if (!rawBalances[ower]) rawBalances[ower] = {};
        rawBalances[ower][payerId] = (rawBalances[ower][payerId] || 0) + owerOwesPayer;
      }
    });
  });

  settlements.forEach(settle => {
    const from = settle.paid_by;
    const to = settle.paid_to;
    const amount = settle.amount * settle.conversion_rate;

    if (!rawBalances[from]) rawBalances[from] = {};
    rawBalances[from][to] = (rawBalances[from][to] || 0) - amount;
  });

  // Simplify net positions
  const netPositions = {}; // userId -> amount (+ means they are owed, - means they owe)
  
  Object.keys(rawBalances).forEach(ower => {
    Object.keys(rawBalances[ower]).forEach(isOwed => {
      const amount = rawBalances[ower][isOwed];
      netPositions[ower] = (netPositions[ower] || 0) - amount;
      netPositions[isOwed] = (netPositions[isOwed] || 0) + amount;
    });
  });

  // Debt simplification (Greedy Min-Cash-Flow)
  const debts = [];
  const credit = Object.entries(netPositions).filter(x => x[1] > 0.01).sort((a, b) => b[1] - a[1]);
  const debit = Object.entries(netPositions).filter(x => x[1] < -0.01).sort((a, b) => a[1] - b[1]);

  let i = 0, j = 0;
  while (i < credit.length && j < debit.length) {
    const amount = Math.min(credit[i][1], -debit[j][1]);
    debts.push({
      from: debit[j][0],
      to: credit[i][0],
      amount: Math.round(amount * 100) / 100
    });
    credit[i][1] -= amount;
    debit[j][1] += amount;
    if (credit[i][1] < 0.01) i++;
    if (debit[j][1] > -0.01) j++;
  }

  // Update balances table
  await prisma.$transaction([
    prisma.balance.deleteMany({
      where: groupId ? { group_id: groupId } : { group_id: null, OR: [
        { user_id_from: userPair[0], user_id_to: userPair[1] },
        { user_id_from: userPair[1], user_id_to: userPair[0] }
      ]}
    }),
    prisma.balance.createMany({
      data: debts.map(d => ({
        group_id: groupId,
        user_id_from: d.from,
        user_id_to: d.to,
        net_amount: d.amount
      }))
    })
  ]);
}

module.exports = { recomputeBalances };
