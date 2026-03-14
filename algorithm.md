# Leave Optimizer Algorithm

The Leave Optimizer uses a **Dynamic Programming (DP)** approach to solve a resource allocation problem: maximizing consecutive time off (utility) given a limited budget of paid leave days.

## 1. The Core DP Table

The algorithm builds a 2D table `dp[i][b]` where:
- `i` is the current day index (from the start date to Dec 31st).
- `b` is the remaining leave budget (from 0 to the user's total budget).
- The value at `dp[i][b]` represents the **maximum possible cumulative utility score** achievable from day `i` until the end of the year, given `b` remaining leave days.

## 2. Decision Making (State Transition)

For every day `i` and budget `b`, the algorithm evaluates two main choices:

1.  **Skip (Stay):** Don't start a leave block on day `i`.
    - `utility = dp[i+1][b]`
2.  **Start a Bridge:** Spend `k` days of leave (where `1 <= k <= b`) to create a continuous block of "Off" days starting at day `i`.
    - `utility = BlockScore(i, k) + dp[next_available_day][b - k]`

The algorithm chooses the option that yields the higher utility.

## 3. Block Identification & Expansion

When considering a bridge starting at day `i`:
- The algorithm calculates how many workdays are needed to reach the next "naturally" occurring off-day (weekend or holiday).
- Once a workday is "bought," the block automatically "expands" to include all adjacent weekends and holidays.
- **Example:** If you have a Friday holiday and you "buy" Thursday, the algorithm identifies a 4-day block (Thu-Fri-Sat-Sun) at the cost of only 1 leave day.

## 4. The "Anchor" Requirement

To ensure high-value bridges, a **validity filter** is applied to every potential block:
- **Definition of an Anchor:** A day that is already an off-day due to a **Public Holiday** or a **Manual Sick Day**.
- **The Rule:** A suggested leave block must contain at least one **Anchor**.
- **Impact:** This prevents the optimizer from wasting paid leave to simply connect two ordinary weekends (which would cost 5 days for a 9-day break). It forces the algorithm to "hunt" for holidays and build bridges around them.

## 5. The Scoring Formula (Utility)

The "value" of a valid block is determined by a **Log-Additive** formula that balances raw efficiency with a subtle bonus for longer breaks:

$$Score = \frac{L}{C + 1} + (P \times \log_2(L))$$

- **$L$ (Length of Bridge):** The total consecutive days off (including the weekends/holidays bridged).
- **$C$ (Paid Days Spent):** The actual cost to your leave budget.
- **$P$ (Length Bias):** A user-controlled multiplier (default 1.0). 

### Why Log-Additive?
Unlike exponential scoring, this formula has **diminishing returns** for extremely long blocks. The logarithmic term ($\log_2$) ensures that adding more days to a block provides a helpful bonus but won't "explode" the score. This forces the algorithm to prioritize high-efficiency "Smart Bridges" (e.g., spending 1 day to get 4-5 days off) multiple times throughout the year, rather than dumping the entire budget into one massive, inefficient vacation.

## 6. Backward Induction

The algorithm solves the table **backwards** starting from December 31st.
- It first calculates the best possible outcomes for the very last day of the year.
- It then uses those results to calculate the best outcomes for the day before, and so on, until it reaches "Today."
- This ensures that every choice made today is mathematically optimal relative to all future possibilities for the rest of the year.

## 7. Strategy Reconstruction

Once the table is full, the algorithm starts at `dp[today][total_budget]` and follows the pre-calculated "best choices" forward in time to reconstruct the specific list of dates for your optimized leave plan.
