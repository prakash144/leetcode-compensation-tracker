# 🧭 Run Local Guide

## 📌 Overview

This guide helps you quickly run the **Leetcode Compensation Dashboard** (or any static HTML/JS project) on your local machine using Python’s built-in HTTP server.

---

## ⚙️ Prerequisites

Make sure you have:

- **Python 3.x** installed

  > Check your version:
  >

  ```bash
  python --version
  ```


## 🚀 Steps to Run Locally

1. **Open Terminal / Command Prompt**

   Navigate to your project folder:

   <pre class="overflow-visible!" data-start="659" data-end="700"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>cd</span><span> path/to/your/project
   </span></span></code></div></div></pre>
2. **Start a Local Server**

   Run the following command:

   <pre class="overflow-visible!" data-start="763" data-end="807"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>python -m http.server 8000
   </span></span></code></div></div></pre>

   * This starts a simple HTTP server on  **port 8000** .
   * You can change the port (e.g., `python -m http.server 8080`).
3. **Open in Browser**

   Visit the following URL:

   <pre class="overflow-visible!" data-start="987" data-end="1022"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>http:</span><span>//localhost:8000</span><span>
   </span></span></code></div></div></pre>

   You should now see your dashboard or web page running locally.

---

## 🧩 Optional Commands

| Action               | Command                                           | Notes                             |
| -------------------- | ------------------------------------------------- | --------------------------------- |
| Change Port          | `python -m http.server 8080`                    | Use any available port            |
| Serve a Subdirectory | `python -m http.server 8000 --directory ./dist` | Serve files from `./dist`folder |
| Stop Server          | `Ctrl + C`                                      | Stops the local server            |
