# Leave Optimizer

The **Leave Optimizer** is a tool designed to help you maximize your consecutive time off by strategically planning your leave days around public holidays and weekends.

## Features

- **Optimal Leave Calculation:** Uses dynamic programming to find the best blocks of time off.
- **Customizable Tuning:** Adjust "Length Bias" (to prioritize longer breaks) and "Stinginess" (to conserve leave days).
- **Manual Overrides:** Manually mark sick days, paid days, or custom public holidays.
- **Global Holiday Data:** Fetches public holidays for various countries and regions.
- **Interactive Calendar:** Real-time visualization of your leave strategy.

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
3.  (Optional) Click on the calendar days to manually mark **Sick Days**, **Manual Paid Days**, or **Custom Holidays**.
4.  Adjust the **Tuning** sliders:
    - **Length Bias:** Higher values favor longer continuous blocks of time off.
    - **Stinginess:** Higher values minimize the number of leave days spent.
5.  Click **OPTIMIZE** to generate your plan.
6.  Use **Print Plan** to save or print your optimized calendar.

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Axios, Date-fns.
- **Backend:** Python, FastAPI, Uvicorn, Requests.
- **Holiday API:** [Nager.Date API](https://date.nager.at/)
