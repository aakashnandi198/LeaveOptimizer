from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from datetime import datetime, timedelta
from typing import Optional, List
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OptimizeRequest(BaseModel):
    country: str
    province: Optional[str] = None
    year: int
    leave_count: int
    manual_sick_days: List[str] = []
    manual_paid_days: List[str] = []
    manual_public_holidays: List[str] = []
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
        holiday_map = {h['date']: h['name'] for h in holidays_data}
        
        # Add manual holidays to the map
        for d in req.manual_public_holidays:
            if d not in holiday_map:
                holiday_map[d] = "Manual Holiday"
        
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
            # A day is "off" if it's a weekend, a holiday (API or manual), a sick day, OR a manual paid day
            is_off = is_weekend(curr) or d_str in holiday_map or d_str in manual_sick_set or d_str in manual_paid_set
            calendar.append({"date": d_str, "is_off": is_off})
            curr += timedelta(days=1)
        
        N = len(calendar)
        B = total_budget
        dp = [[-1.0] * (B + 1) for _ in range(N + 1)]
        choice = [[None] * (B + 1) for _ in range(N + 1)]
        for b in range(B + 1): dp[N][b] = 0.0
            
        for i in range(N - 1, -1, -1):
            for b in range(B + 1):
                dp[i][b] = dp[i+1][b]
                choice[i][b] = (i + 1, 0, None)
                if calendar[i]["is_off"]: continue
                
                workdays_found = 0
                for j in range(i, N):
                    if not calendar[j]["is_off"]: workdays_found += 1
                    if workdays_found > b: break
                    if j == N - 1 or calendar[j+1]["is_off"]:
                        actual_start = i
                        while actual_start > 0 and calendar[actual_start-1]["is_off"]: actual_start -= 1
                        actual_end = j
                        while actual_end < N - 1 and calendar[actual_end+1]["is_off"]: actual_end += 1
                            
                        length = actual_end - actual_start + 1
                        cost = workdays_found
                        bridge_benefit = length - cost
                        score = ((bridge_benefit + 1) ** req.numerator_power) / ((cost + 0.1) ** req.denominator_power)
                        
                        next_i = actual_end + 1
                        total_score = score + dp[next_i][b - cost]
                        if total_score > dp[i][b]:
                            dp[i][b] = total_score
                            choice[i][b] = (next_i, cost, {
                                "max_days": length,
                                "leave_dates": [calendar[k]["date"] for k in range(i, j+1) if not calendar[k]["is_off"]],
                                "leave_spent": cost,
                                "start_date": calendar[actual_start]["date"],
                                "end_date": calendar[actual_end]["date"],
                                "efficiency": round(length / (cost + 0.1), 2)
                            })

        strategy = []
        curr_i, curr_b = 0, B
        while curr_i < N and choice[curr_i][curr_b]:
            next_i, cost, block = choice[curr_i][curr_b]
            if block: strategy.append(block)
            curr_i, curr_b = next_i, curr_b - cost
            
        return {
            "strategy": strategy,
            "dp_grid": dp,
            "calendar": [c["date"] for c in calendar]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
