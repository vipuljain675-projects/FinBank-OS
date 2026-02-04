# 🏦 FinBank OS

**The AI-Powered Financial Operating System.**

A production-grade, full-stack financial dashboard simulating a modern banking environment. Built with **Next.js 14**, **TypeScript**, and a custom-engineered **Real-Time Market Engine**.

Live-demo link - https://fin-bank-os.vercel.app/

## 🚀 Key Features

* **⚡ Instant Navigation:** Powered by **TanStack Query**. Experiences are cached for zero-latency navigation between Dashboard, Transactions, and Cards.
* **📈 Custom Market Engine:** A server-side proxy API (built on `yahoo-finance2`) that scrapes real-time prices for **ALL** assets (NSE, BSE, NASDAQ, Crypto) without hitting rate limits or paywalls.
* **🤖 FinBot AI:** Integrated AI financial assistant that provides insights on portfolio performance and spending habits.
* **🎨 Cinematic UI:** Staggered entrance animations and dynamic "count-up" statistics powered by **GSAP** for a native-app feel.
* **💳 Virtual Card System:** Issue virtual cards, set monthly spending limits, and toggle "Freeze/Unfreeze" states instantly.
* **📊 Financial Analytics:** Interactive visualizations of income vs. expenses using Recharts.

---

## ⚠️ Simulation Disclaimer

**This application is a Financial Simulator.**

* **Fake Money:** All money displayed (Balances, Income, Portfolio Value) is simulated. No real funds are held or transferred.
* **Simulated Transactions:** "Wire Transfers" and "Card Payments" perform real database operations (creating logs, updating MongoDB documents), but they do not interface with real banking networks (SWIFT/ACH).
* **Educational Use:** This project demonstrates advanced full-stack engineering concepts (ACID transactions, real-time data fetching, caching strategies) in a sandboxed environment.

---

## 🏗️ Engineering Highlights

### 1. The "Unlimited" Market Data Engine
**The Problem:** Standard free stock APIs (Finnhub, Alpha Vantage) have severe limitations:
* Rate limits (e.g., 5 calls/minute).
* Poor support for Indian stocks (often returning `0` or `null` for NSE symbols).

**The Solution:** I engineered a custom **Gateway API** (`/api/market-data`) that:
1.  Accepts a batch of symbols from the frontend.
2.  Bypasses standard API keys by scraping public finance data directly via a server-side engine.
3.  **Result:** The dashboard displays real-time, accurate prices for **Reliance**, **TCS**, **Apple**, and **Bitcoin** simultaneously, with zero "premium" costs.

### 2. High-Performance Caching
**The Architecture:**
Instead of `useEffect` fetching on every mount, the app uses **TanStack Query** to manage server state.
* **Stale-While-Revalidate:** Data remains fresh for 5 minutes.
* **Background Polling:** The portfolio page silently refreshes market prices every 10 seconds without blocking the UI.
* **Optimistic Updates:** UI updates instantly when toggling card locks, reverting only if the server fails.

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | MongoDB (Mongoose ODM) |
| **State & Cache** | TanStack Query (React Query) |
| **Animation** | GSAP (GreenSock) |
| **Market Data** | Yahoo Finance 2 (Custom Implementation) |
| **Styling** | Tailwind CSS + Lucide Icons |
| **Auth** | JWT (Stateless Authentication) |

---

## 📂 Project Structure

```text
FinBank-OS/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── market-data/    # 🚀 Custom Scraper Engine
│   │   │   ├── transactions/   # Transfer Logic (Backend)
│   │   │   └── ...
│   │   ├── dashboard/          # Main Dashboard
│   │   ├── investments/        # Portfolio & Live Ticker
│   │   ├── finbot/             # 🤖 AI Assistant Page
│   │   └── ...
│   ├── components/             # Reusable UI Components
│   ├── context/                # Global State (Currency INR/USD)
│   ├── lib/                    # DB Connection & Models
│   └── providers/              # TanStack Query Wrapper



## 🚧 Challenges & Ongoing Development

Building a financial OS comes with unique engineering hurdles. Here are the current technical challenges being addressed:

### 1. The Stock Data Dilemma
**The Issue:** Reliable, free stock market APIs for Indian Markets (NSE/BSE) are nearly non-existent.
* **Finnhub/Alpha Vantage:** Provide excellent US data but strictly rate-limit free tiers (5 calls/min) and often return `null` or delayed data for Indian symbols like `RELIANCE.NS`.
* **The Fix:** I engineered a custom **"Gateway API"** (`/api/market-data`) that bypasses standard API keys by scraping public financial data via a server-side engine. This allows the app to fetch real-time prices for **Reliance, TCS, Apple, and Bitcoin** simultaneously without crashing due to rate limits.

### 2. FinBot AI Maturity
**The Issue:** The current AI implementation is a basic iteration.
* **Current State:** It operates on a simple retrieval-based model. While it can answer basic queries about the dashboard, it lacks deep context awareness and advanced financial reasoning.
* **The Plan:** I am actively working on upgrading this to a specialized **LLM Agent (RAG)**. The goal is to allow it to parse complex queries like *"Analyze my spending trend over the last 3 months and suggest budget cuts,"* by giving it read-access to the user's transaction history vector database.
