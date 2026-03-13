# Leave Optimizer

The **Leave Optimizer** is a tool designed to help you maximize your consecutive time off by strategically planning your leave days around public holidays and weekends.

## Features

- **Optimal Leave Calculation:** Uses dynamic programming to find the best blocks of time off.
- **Anchor-Based Optimization:** Suggested leave blocks are strategically built around "anchors" (Public Holidays or Sick Days) to ensure high-value bridges.
- **Customizable Tuning:** Adjust "Length Bias" to prioritize longer continuous breaks.
- **Manual Overrides:** 
  - Manually mark **Sick Days** and **Paid Days**.
  - Add **Custom Public Holidays** with personalized descriptions.
  - **Remove/Ignore** API-provided holidays that you don't actually get.
- **Global Holiday Data:** Fetches public holidays for various countries and regions.
- **Interactive Calendar:** Real-time visualization of your leave strategy with beautiful, color-coded days.
- **DP Heatmap Visualization:** A debug view that exposes the underlying Dynamic Programming "Utility" grid as an interactive heatmap.
- **Print-Ready:** Beautifully formatted A4 Landscape PDF exports with full color preservation.

---

## Project Structure

- `backend/`: FastAPI (Python) server handling the optimization logic and holiday data fetching.
- `frontend/`: React (Vite/Tailwind CSS) application for the user interface.

---

## Prerequisites

- **Python 3.8+**
- **Node.js** (npm included)

---

## Getting Started

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv .venv
    ```
3.  Activate the virtual environment:
    - **Linux/macOS:** `source .venv/bin/activate`
    - **Windows:** `.venv\Scripts\activate`
4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
5.  Start the server:
    ```bash
    python main.py
    ```
    *The backend will run at [http://localhost:8000](http://localhost:8000).*

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    *The frontend will typically run at [http://localhost:5173](http://localhost:5173).*

---

## Usage

1.  Select your **Country** and **Region**.
2.  Set your **Paid Leave Budget** and **Sick Day Budget**.
3.  **Manual Editing (Calendar Click):**
    - **SICK/PAID Mode:** Click days to mark them.
    - **HOL (Holiday) Mode:** 
      - Click a blank day to add a **Custom Holiday** (you will be prompted for a description).
      - Click an existing API holiday to **Remove/Ignore** it.
4.  **Tuning:** Adjust **Length Bias** to favor longer breaks.
5.  Click **OPTIMIZE** to generate your plan.
6.  **Debug:** Toggle **DEBUG DP GRID** to see the internal cost-benefit analysis.
7.  **Clear:** Use the **CLEAR** button to reset the suggested plan while **preserving** your manual entries.
8.  **Print:** Use **Print Plan** to generate a beautiful A4 Landscape PDF.

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Axios, Date-fns.
- **Backend:** Python, FastAPI, Uvicorn, Requests.
- **Holiday API:** [Nager.Date API](https://date.nager.at/)
