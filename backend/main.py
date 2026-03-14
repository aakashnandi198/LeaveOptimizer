from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from datetime import datetime, timedelta
from typing import Optional, List
import uvicorn
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ManualHoliday(BaseModel):
    date: str
    name: str

class OptimizeRequest(BaseModel):
    country: str
    province: Optional[str] = None
    year: int
    leave_count: int
    manual_sick_days: List[str] = []
    manual_paid_days: List[str] = []
    manual_public_holidays: List[ManualHoliday] = []
    removed_public_holidays: List[str] = []
    numerator_power: float = 1.0
    denominator_power: float = 1.0

def get_holidays_raw(year: int, country_code: str):
    url = f"https://date.nager.at/api/v3/PublicHolidays/{year}/{country_code}"
    response = requests.get(url)
    if response.status_code != 200:
        return []
    return response.json()

def filter_holidays(holidays_raw, province_code: Optional[str]):
    filtered = []
    for h in holidays_raw:
        if province_code:
            if h.get('global') or (h.get('counties') and province_code in h.get('counties')):
                filtered.append({"date": h['date'], "name": h['localName']})
        else:
            filtered.append({"date": h['date'], "name": h['localName']})
    return filtered

@app.get("/countries")
def get_available_countries():
    url = "https://date.nager.at/api/v3/AvailableCountries"
    response = requests.get(url)
    countries = []
    if response.status_code == 200:
        countries = response.json()
    if not any(c['countryCode'] == 'IN' for c in countries):
        countries.append({"countryCode": "IN", "name": "India"})
    return sorted(countries, key=lambda x: x['name'])

@app.get("/provinces/{year}/{country_code}")
def get_provinces(year: int, country_code: str):
    holidays = get_holidays_raw(year, country_code)
    provinces = set()
    for h in holidays:
        if h.get('counties'):
            for c in h.get('counties'):
                provinces.add(c)
    return sorted(list(provinces))

@app.get("/holidays/{year}/{country_code}")
def get_calendar_holidays(year: int, country_code: str, province: Optional[str] = None):
    raw = get_holidays_raw(year, country_code)
    return filter_holidays(raw, province)

def is_weekend(date_obj):
    return date_obj.weekday() >= 5

@app.post("/optimize")
async def optimize_leaves(req: OptimizeRequest):
    try:
        raw_holidays = get_holidays_raw(req.year, req.country)
        holidays_data = filter_holidays(raw_holidays, req.province)
        
        removed_set = set(req.removed_public_holidays)
        holiday_map = {h['date']: h['name'] for h in holidays_data if h['date'] not in removed_set}
        
        # Add manual holidays to the map
        for mh in req.manual_public_holidays:
            holiday_map[mh.date] = mh.name
        
        manual_sick_set = set(req.manual_sick_days)
        manual_paid_set = set(req.manual_paid_days)
        
        total_budget = req.leave_count - len(manual_paid_set)
        if total_budget < 0: total_budget = 0

        today = datetime.now()
        if today.year < req.year:
            start_date = datetime(req.year, 1, 1)
        elif today.year > req.year:
            return {"strategy": []}
        else:
            start_date = datetime(today.year, today.month, today.day)
            
        end_date = datetime(req.year, 12, 31)
        calendar = []
        curr = start_date
        while curr <= end_date:
            d_str = curr.strftime("%Y-%m-%d")
            
            is_h = d_str in holiday_map
            is_s = d_str in manual_sick_set
            is_w = is_weekend(curr)
            is_p = d_str in manual_paid_set
            
            is_off = is_w or is_h or is_s or is_p
            is_anchor = is_h or is_s
            
            calendar.append({"date": d_str, "is_off": is_off, "is_anchor": is_anchor})
            curr += timedelta(days=1)
        
        N = len(calendar)
        B = total_budget
        dp = [[-1.0] * (B + 1) for _ in range(N + 1)]
        choices_table = [[[] for _ in range(B + 1)] for _ in range(N + 1)]
        for b in range(B + 1): dp[N][b] = 0.0
            
        for i in range(N - 1, -1, -1):
            for b in range(B + 1):
                # Option 1: Stay (No Leave)
                dp[i][b] = dp[i+1][b]
                choices_table[i][b] = [(i + 1, 0, None)]
                
                if calendar[i]["is_off"]: continue
                
                # Option 2: Take a Leave Block
                workdays_found = 0
                for j in range(i, N):
                    if not calendar[j]["is_off"]: workdays_found += 1
                    if workdays_found > b: break
                    if j == N - 1 or calendar[j+1]["is_off"]:
                        actual_start = i
                        while actual_start > 0 and calendar[actual_start-1]["is_off"]: actual_start -= 1
                        actual_end = j
                        while actual_end < N - 1 and calendar[actual_end+1]["is_off"]: actual_end += 1
                        
                        has_anchor = any(calendar[k]["is_anchor"] for k in range(actual_start, actual_end + 1))
                        if not has_anchor: continue
                            
                        length = actual_end - actual_start + 1
                        cost = workdays_found
                        
                        efficiency_part = length / (cost + 1.0)
                        length_bonus = math.pow(length, 1.0 + (req.numerator_power / 5.0))
                        score = efficiency_part + length_bonus
                        
                        next_i = actual_end + 1
                        total_score = score + dp[next_i][b - cost]
                        
                        if total_score > dp[i][b] + 1e-9:
                            dp[i][b] = total_score
                            choices_table[i][b] = [(next_i, cost, {
                                "max_days": length,
                                "leave_dates": [calendar[k]["date"] for k in range(i, j+1) if not calendar[k]["is_off"]],
                                "leave_spent": cost,
                                "start_date": calendar[actual_start]["date"],
                                "end_date": calendar[actual_end]["date"],
                                "efficiency": round(length / (cost + 0.1), 2)
                            })]
                        elif abs(total_score - dp[i][b]) < 1e-9:
                            choices_table[i][b].append((next_i, cost, {
                                "max_days": length,
                                "leave_dates": [calendar[k]["date"] for k in range(i, j+1) if not calendar[k]["is_off"]],
                                "leave_spent": cost,
                                "start_date": calendar[actual_start]["date"],
                                "end_date": calendar[actual_end]["date"],
                                "efficiency": round(length / (cost + 0.1), 2)
                            }))

        all_strategies = []
        seen_strategies = set()

        def reconstruct(idx, budget, current_strategy):
            if len(all_strategies) >= 10: return
            if idx >= N:
                # Create a unique key based on sorted leave dates to avoid duplicates
                all_dates = []
                for b in current_strategy:
                    all_dates.extend(b["leave_dates"])
                strat_key = ",".join(sorted(all_dates))
                
                if strat_key not in seen_strategies:
                    all_strategies.append(current_strategy)
                    seen_strategies.add(strat_key)
                return
            
            for next_i, cost, block in choices_table[idx][budget]:
                new_strat = list(current_strategy)
                if block: new_strat.append(block)
                reconstruct(next_i, budget - cost, new_strat)

        reconstruct(0, B, [])
            
        return {
            "strategies": all_strategies,
            "max_score": round(dp[0][B], 2),
            "dp_grid": dp,
            "choices": choices_table,
            "calendar": [c["date"] for c in calendar]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
