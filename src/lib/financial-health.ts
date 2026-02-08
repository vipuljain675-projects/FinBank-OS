export function generateHealthReport(data: any) {
    const { monthlyIncome, monthlyExpense, totalBalance, portfolioValue, portfolioReturn, topCategories } = data;

    // 1. Core Metrics
    const savings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;
    
    // 2. Health Score Algorithm
    let score = 100;
    if (savingsRate < 20) score -= 15;
    if (savingsRate < 0) score -= 25; 
    if (portfolioValue === 0) score -= 10;
    if (portfolioReturn < -5) score -= 5;
    if (totalBalance < monthlyExpense * 3) score -= 10;
    
    score = Math.max(0, Math.min(100, score));

    // 3. Dynamic Summary
    let summary = "";
    if (score >= 80) summary = `Your financial health is highly resilient. You're maintaining a strong savings rate of ${savingsRate.toFixed(1)}% and have a solid cash buffer. Focus on optimizing your asset allocation.`;
    else if (score >= 60) summary = `You are financially stable, but there is room for growth. Your savings rate is ${savingsRate.toFixed(1)}%. Focus on managing top expenses and monitoring portfolio volatility.`;
    else summary = "Immediate attention needed. Your outflows are high relative to your income. Focus on stabilizing your cash flow before making aggressive investments.";

    // 4. SMART Spending Analysis (Fixed 0% Bug)
    const topCatName = topCategories[0]?.name || "General";
    const topCatAmount = topCategories[0]?.amount || 0;
    let topCatPercent = monthlyExpense > 0 ? ((topCatAmount / monthlyExpense) * 100).toFixed(1) : "0";
    
    let spendingAnalysis = "";

    if (monthlyExpense === 0) {
        spendingAnalysis = "We haven't detected significant expenses in the last 30 days. This might mean you rely on cash or a different account. Ensure all your accounts are synced for an accurate picture.";
    } else {
        spendingAnalysis = `Your spending is primarily concentrated in ${topCatName}, making up ${topCatPercent}% of your total outflow. `;
        
        if (topCatName.toLowerCase().includes("food") || topCatName.toLowerCase().includes("dining")) {
            spendingAnalysis += "Dining out frequently is a silent wealth killer. Planning meals just two extra days a week could save you significant capital over a year.";
        } else if (topCatName.toLowerCase().includes("shopping")) {
            spendingAnalysis += "Discretionary shopping seems high this month. Consider implementing a '48-hour rule' before making non-essential purchases.";
        } else if (topCatName.toLowerCase().includes("transfer") || topCatName.toLowerCase().includes("investment")) {
            spendingAnalysis += "This is excellent! High transfer volumes usually indicate you are moving money to savings or investments.";
        } else {
            spendingAnalysis += savingsRate > 20 
                ? "However, since your overall savings rate is healthy, this spending level is perfectly sustainable for your lifestyle."
                : "Reducing costs in this single category by just 10-15% would immediately turn your cash flow positive and boost your financial resilience.";
        }
    }

    // 5. SMART Investment Strategy (Reacts to -2.35%)
    let investmentStrategy = "";
    const isPortfolioDown = portfolioReturn < 0;

    if (portfolioValue === 0) {
        investmentStrategy = "You currently have no active investments. Inflation is effectively eroding your cash holdings. Start small: Open a brokerage account and consider a low-cost, broad-market Index Fund.";
    } 
    else if (isPortfolioDown) {
        // 🔥 SCENARIO: Market is Down
        investmentStrategy = `Your portfolio is currently experiencing a drawdown of ${Math.abs(portfolioReturn).toFixed(2)}%. Do not panic sell. Market corrections are normal. Since you have cash reserves, this is technically a 'discount' period—consider averaging down on your highest conviction assets.`;
    } 
    else if (portfolioReturn > 15) {
        // SCENARIO: Market is Up High
        investmentStrategy = `Your portfolio is performing exceptionally well with a ${portfolioReturn.toFixed(2)}% return. Beware of market euphoria. Consider rebalancing: trim profits from high-flyers and move them into stable assets to lock in gains.`;
    } 
    else {
        // SCENARIO: Stable / Flat
        investmentStrategy = `Your portfolio is relatively stable with a ${portfolioReturn.toFixed(2)}% return. Ensure you are well-diversified across sectors (Tech, Finance, Healthcare) to hedge against future volatility.`;
    }

    // 6. Action Items
    const actionItems = [];
    if (isPortfolioDown) actionItems.push("Review your portfolio: Ensure you aren't holding fundamentally broken assets. Hold the strong ones.");
    else actionItems.push("Check your asset allocation: Ensure you aren't over-exposed to a single volatile sector.");
    
    actionItems.push(`Audit your ${topCatName} expenses from the last 30 days.`);
    actionItems.push("Automate a transfer of 10% of your income to a separate, high-yield savings account.");

    // 7. Recommended Budget
    const needs = monthlyIncome * 0.5;
    const wants = monthlyIncome * 0.3;
    
    const recommendedBudget = {
        "Bills & Utilities": Math.round(needs * 0.4),
        "Food & Dining": Math.round(needs * 0.3),
        "Healthcare": Math.round(needs * 0.2),
        "Transport": Math.round(needs * 0.1),
        "Shopping": Math.round(wants * 0.5),
        "Entertainment": Math.round(wants * 0.5),
        "Savings & Investments": Math.round(monthlyIncome * 0.2),
        "Debt Repayment": savings < 0 ? Math.abs(savings) : 0
    };

    return {
        metrics: {
            totalBalance,
            monthlyIncome,
            monthlyExpense,
            portfolioValue
        },
        healthScore: score,
        summary,
        spendingAnalysis,
        investmentStrategy,
        savingsRecommendations: [
            isPortfolioDown ? "Avoid liquidating investments during this downturn unless absolutely necessary." : "Consider setting up an automatic sweep to move excess cash into investments.",
            `Evaluate fixed expenses like ${topCatName} for potential negotiation.`
        ],
        recommendedBudget,
        actionItems
    };
}