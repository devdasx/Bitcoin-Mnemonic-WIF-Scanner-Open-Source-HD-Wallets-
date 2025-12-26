# ⚡ Bitcoin Mnemonic & WIF Scanner (Open Source)

**Created by people who love Bitcoin, for the community.** 🧡

This is a powerful, open-source tool designed to scan and validate Bitcoin wallets efficiently. It uses a high-speed "sliding window" engine to process large lists without crashing or freezing.

### 🚀 Features
* **Universal Scanner:** Works with **Mnemonics** (12, 15, 18, 21, 24 words) and **WIF Private Keys** (Compressed & Uncompressed).
* **Smart Validation:** Automatically detects valid BIP39 mnemonics and filters out invalid ones.
* **High Performance:** Runs 500 concurrent checks efficiently.
* **Retry Logic:** Automatically retries failed network requests up to 5 times.
* **Privacy:** Cleans your input file and saves results to `balances.txt`.

---

## 🛠 Prerequisites

You need **Node.js** installed on your computer to run this.

* **Windows:** [Download Node.js here](https://nodejs.org/) (Choose the "LTS" version).
* **macOS:** [Download Node.js here](https://nodejs.org/) or run `brew install node` in terminal.

---

## 📖 How to Use

### 1. Installation
Open your Terminal (macOS) or Command Prompt (Windows) and run these commands:

# Clone this repository
git clone [https://github.com/devdasx/BTC-Scanner.git](https://github.com/YOUR_USERNAME/BTC-Scanner.git)

# Go into the folder
cd BTC-Scanner

# Install dependencies
npm install
