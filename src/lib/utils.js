export function genCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

/**
 * Given a list of expenses and member names, calculates the minimum
 * set of transactions needed to settle all debts.
 *
 * Returns array of { from, to, amount } objects.
 */
export function calcSettlement(expenses = [], members = []) {
  // Build net balance for each member (positive = owed money, negative = owes money)
  const balance = {};
  members.forEach(m => (balance[m] = 0));

  expenses.forEach(({ paidBy, amount, splitAmong }) => {
    if (!splitAmong?.length || !paidBy) return;
    // Only count members who are still in the trip
    const validSplit = splitAmong.filter(m => members.includes(m));
    if (!validSplit.length) return;
    const share = amount / validSplit.length;
    balance[paidBy] = (balance[paidBy] || 0) + amount;
    validSplit.forEach(m => { balance[m] = (balance[m] || 0) - share; });
  });

  // Separate into creditors (positive) and debtors (negative)
  const creditors = Object.entries(balance)
    .filter(([, v]) => v > 0.005)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = Object.entries(balance)
    .filter(([, v]) => v < -0.005)
    .map(([name, amount]) => ({ name, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const transactions = [];

  // Greedy matching: always pair the biggest creditor with the biggest debtor
  let ci = 0, di = 0;
  const creds = creditors.map(x => ({ ...x }));
  const debts = debtors.map(x => ({ ...x }));

  while (ci < creds.length && di < debts.length) {
    const c = creds[ci];
    const d = debts[di];
    const amt = Math.min(c.amount, d.amount);
    const rounded = Math.round(amt * 100) / 100;

    if (rounded > 0) {
      transactions.push({ from: d.name, to: c.name, amount: rounded });
    }

    c.amount -= amt;
    d.amount -= amt;

    if (c.amount < 0.005) ci++;
    if (d.amount < 0.005) di++;
  }

  return transactions;
}