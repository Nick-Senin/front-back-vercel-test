from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="FastAPI on Vercel")

# CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "message": "FastAPI on Vercel", "source": "serverless"}

@app.get("/api/health")
def health():
    return {"ok": True}

@app.post("/api/echo")
async def echo(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = None
    return JSONResponse(content={"received": data})

@app.get("/api/weather/omsk")
async def weather_omsk():
    latitude = 54.9914
    longitude = 73.3645
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        return JSONResponse(status_code=502, content={"error": "weather_fetch_failed", "detail": str(exc)})

    return {
        "city": "Omsk",
        "coordinates": {"latitude": latitude, "longitude": longitude},
        "current": data.get("current"),
        "meta": {"source": "open-meteo.com"},
    }

@app.get("/api/users")
def get_users():
    return {
        "users": [
            {"id": 1, "name": "Alice", "email": "alice@example.com"},
            {"id": 2, "name": "Bob", "email": "bob@example.com"},
            {"id": 3, "name": "Charlie", "email": "charlie@example.com"}
        ]
    }
