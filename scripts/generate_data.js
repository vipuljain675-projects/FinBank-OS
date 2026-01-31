// scripts/generate_data.js
const fs = require('fs');

const riskLevels = ['conservative', 'moderate', 'aggressive', 'growth-focused'];
const goals = ['retirement', 'buying a house', 'emergency fund', 'passive income'];
const amounts = ['$5,000', '$15,000', '$50,000', '$100,000'];

const generatePrompt = () => {
  const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
  const goal = goals[Math.floor(Math.random() * goals.length)];
  const amount = amounts[Math.floor(Math.random() * amounts.length)];

  return {
    instruction: `You are a financial advisor. A user has ${amount} and wants to invest for ${goal} with a ${risk} strategy. Suggest an allocation.`,
    input: "",
    output: `**Strategy: ${risk.toUpperCase()} Growth**\n\nTo achieve your goal of ${goal}, I recommend the following allocation based on a ${risk} risk profile:\n\n| Asset Class | Allocation | Amount | Ticker Examples |\n|---|---|---|---|\n| US Equities | ${risk === 'aggressive' ? '60%' : '40%'} | ${risk === 'aggressive' ? '$' + (parseInt(amount.replace(/\D/g,''))*0.6) : '$' + (parseInt(amount.replace(/\D/g,''))*0.4)} | VTI, VOO |\n| Int'l Equities | 20% | $... | VXUS |\n| Bonds/Fixed | ${risk === 'aggressive' ? '10%' : '30%'} | ... | BND |\n| Cash/Reserves | 10% | ... | HYSA |\n\n**Reasoning:** This mix maximizes upside while maintaining liquidity for your specific goal.`
  };
};

const data = [];
// Generate 500 examples
for (let i = 0; i < 500; i++) {
  data.push(generatePrompt());
}

fs.writeFileSync('finbank_dataset.json', JSON.stringify(data, null, 2));
console.log("✅ Generated 500 training examples in finbank_dataset.json");