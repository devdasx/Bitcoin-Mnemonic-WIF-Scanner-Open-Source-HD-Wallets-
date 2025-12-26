# ⚡ Universal Bitcoin Scanner (Modern & Fast)

![License](https://img.shields.io/badge/license-MIT-green) ![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-blue) ![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey)

**Created by Bitcoiners, for the Community.** 🧡

Welcome to the **Universal Bitcoin Scanner**, a high-performance, open-source desktop application designed to validate and check balances for Bitcoin wallets.

We have recently upgraded the interface to a **Modern "Apple-Style" Aesthetic** featuring dark/light mode, glassmorphism headers, and smooth animations. Under the hood, it uses a **"Sliding Window" asynchronous engine** that keeps exactly 500 concurrent checks active at all times, ensuring maximum speed without freezing your computer.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **🎨 Modern UI** | Beautiful **Apple-Style interface** with frosted glass headers, smooth animations, and a **Dark/Light Mode** toggle. |
| **📂 Smart Import** | New **"Import Text File"** feature allows you to load huge lists (50k+ lines) instantly without crashing the app. |
| **🗝️ Universal Support** | Compatible with **BIP39 Mnemonics** (12, 15, 18, 21, 24 words) and **WIF Private Keys** (Compressed `L/K` & Uncompressed `5`). |
| **⚡ High-Speed Engine** | Runs **500 concurrent worker threads**. Processing is continuous and non-blocking. |
| **🛑 Control** | Includes a **Stop Button** to gracefully pause scanning at any time, and a **Clear Button** to reset inputs. |
| **🔄 Auto-Retry System** | If an API request fails, the system automatically retries that specific item up to **5 times** before skipping. |
| **💾 Auto-Save** | All hits (wallets with balance) are automatically saved to `found_balances.txt` on your **Desktop**. |

---

## 🛠 Prerequisites

Before running this tool, you need **Node.js** installed on your computer.

* **Windows:** [Download Node.js (LTS Version)](https://nodejs.org/)
* **macOS:** [Download Node.js (LTS Version)](https://nodejs.org/)
    * *Alternative for Mac users:* Run `brew install node` in your Terminal.

---

## 📖 Step-by-Step Installation Guide

Follow these steps to set up the scanner on your machine.

### 1. Download the Code
Open your **Terminal** (on Mac) or **Command Prompt** (on Windows) and enter the following command:

git clone https://github.com/devdasx/Bitcoin-Mnemonic-WIF-Scanner-Open-Source-HD-Wallets-.git

### 2. Enter the Project Folder
Move your terminal session inside the folder:

cd Bitcoin-Mnemonic-WIF-Scanner-Open-Source-HD-Wallets-

### 3. Install Dependencies
This command installs the necessary tools (Electron, Axios, BIP39) required to run the app:

npm install

---

## 🖥️ How to Use

### 1. Start the Application
Launch the graphical interface with a single command:

npm start

### 2. Scanning Wallets
1.  **Input Data:**
    * *Small Lists:* Paste Mnemonics or WIF keys directly into the text area.
    * *Large Lists (>5,000 lines):* Click **"Import Text File..."** to load a `.txt` file instantly.
2.  **Start:** Click **"Start Scanning"**. The app will validate your keys and begin the sliding window process.
3.  **Monitor:** Watch the speed (lines/sec) and progress bar.
4.  **Results:**
    * **Live Hits:** Wallets with a balance appear in the results list immediately.
    * **Desktop Save:** A file named `found_balances.txt` is created/updated on your Desktop with every hit.

---

## ⚙️ Technical Logic (How it works)

For developers curious about the implementation:

1.  **Input Cleaning:** The raw text is deduped using a JavaScript `Set`.
2.  **Type Detection:**
    * **Mnemonics:** Validated against the BIP39 English wordlist using the `bip39` library.
    * **WIFs:** Checked for Base58 characters, length, and correct prefixes (`5`, `K`, `L`).
3.  **The Worker Pool:** We create an `Iterator` from the valid list and spawn 500 `Promise` loops. Each loop grabs the next item, awaits the API response, and immediately grabs the next. This ensures strict concurrency limits without batching delays.

---

## ⚠️ Disclaimer

**Educational Use Only.**
This software is provided "as is", without warranty of any kind. It is intended for educational purposes and for recovering lost access to your own wallets. The authors are not responsible for any misuse of this tool or any local laws you may violate.

**Always respect privacy and ownership.**

---

### ❤️ Contributing
This is an open-source project. If you are a developer, feel free to submit a Pull Request to improve the UI or optimize the engine!

---

## ☕ Support the Project

If this tool helped you recover funds or you simply love open-source Bitcoin tools, consider buying us a coffee:

**BTC:** bc1q27yjuts9jjzwgf8m8dq9fmdjgmq4a0fwrp7a5c5ydckyu3ltm78s8cg2w2

🧡
