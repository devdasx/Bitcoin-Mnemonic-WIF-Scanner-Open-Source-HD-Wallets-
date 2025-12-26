# ⚡ Bitcoin Mnemonic & WIF Scanner (Open Source)

![License](https://img.shields.io/badge/license-MIT-green) ![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-blue) ![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey)

**Created by Bitcoiners, for the Community.** 🧡

Welcome to the **Universal Bitcoin Scanner**, a high-performance, open-source desktop application designed to validate and check balances for Bitcoin wallets.

Unlike standard scanners that freeze when processing large lists, this tool utilizes a **"Sliding Window" asynchronous engine**. This ensures that exactly 500 concurrent checks are always active—as soon as one wallet is processed, the next one immediately begins, maximizing network efficiency without crashing your CPU.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **🗝️ Universal Support** | Compatible with **BIP39 Mnemonics** (12, 15, 18, 21, 24 words) and **WIF Private Keys** (Compressed `L/K` & Uncompressed `5`). |
| **🧠 Smart Validation** | Uses the `bip39` library to mathematically validate checksums before sending network requests, saving time on invalid phrases. |
| **⚡ High-Speed Engine** | Runs **500 concurrent worker threads**. Processing is continuous and non-blocking. |
| **🔄 Auto-Retry System** | If an API request fails (network error), the system automatically retries that specific item up to **5 times** before skipping. |
| **🛡️ Privacy First** | No data is sent to third-party servers other than the public blockchain balance check. Input files are cleaned locally. |
| **💰 Auto-Conversion** | Automatically converts Satoshi balances to **BTC** (decimal format) for easy reading. |

---

## 🛠 Prerequisites

Before running this tool, you need **Node.js** installed on your computer. This allows the JavaScript code to run outside of a browser.

* **Windows:** [Download Node.js (LTS Version)](https://nodejs.org/)
* **macOS:** [Download Node.js (LTS Version)](https://nodejs.org/)
    * *Alternative for Mac users:* Run `brew install node` in your Terminal.

---

## 📖 Step-by-Step Installation Guide

Follow these steps to set up the scanner on your machine.

### 1. Download the Code
Open your **Terminal** (on Mac) or **Command Prompt** (on Windows) and enter the following command. This downloads the source code to your computer.

git clone https://github.com/devdasx/Bitcoin-Mnemonic-WIF-Scanner-Open-Source-HD-Wallets-.git

### 2. Enter the Project Folder
Now, move your terminal session inside the folder you just downloaded.

cd Bitcoin-Mnemonic-WIF-Scanner-Open-Source-HD-Wallets-

### 3. Install Dependencies
This command asks `npm` (Node Package Manager) to read the `package.json` file and automatically install all the necessary tools (like `electron`, `axios`, and `bip39`) required to make the app work.

npm install

---

## 🖥️ How to Use

### 1. Start the Application
Once installed, you can launch the graphical interface with a single command:

npm start

A black window titled **"BTC Scanner Pro"** will appear.

### 2. Scanning Wallets
1.  **Paste your list:** In the large text area, paste your Mnemonics or WIF keys. You can mix them together; the tool will sort them out.
2.  **Click "Start Scanning":** The app will first validate the format of your keys.
3.  **Watch Progress:** The bar at the bottom will show you the speed (lines/second) and progress.
4.  **View Hits:** If a wallet with a balance is found, it will appear in Green in the "Results" section.
5.  **Auto-Save:** Valid hits are also automatically saved to a file named `found_balances.txt` on your Desktop (or project folder) for safety.

---

## ⚙️ Technical Logic (How it works)

For the developers curious about the "Sliding Window" implementation:

1.  **Input Cleaning:** The raw text is split by newlines and deduped using a JavaScript `Set`.
2.  **Type Detection:**
    * **Mnemonics** are validated against the BIP39 English wordlist.
    * **WIFs** are checked for Base58 characters and correct prefixes (`5`, `K`, `L`).
3.  **The Worker Pool:** We create an `Iterator` from the valid list. We then spawn 500 `Promise` loops. Each loop grabs the next item from the iterator, awaits the API response, and then grabs the next. This ensures strict concurrency limits without `Promise.all` batching delays.

---

## ⚠️ Disclaimer

**Educational Use Only.**
This software is provided "as is", without warranty of any kind. It is intended for educational purposes and for recovering lost access to your own wallets. The authors are not responsible for any misuse of this tool or any local laws you may violate.

**Always respect privacy and ownership.**

---

### ❤️ Contributing
This is an open-source project. If you are a developer, feel free to submit a Pull Request to improve the UI, add new scanners, or optimize the engine!
