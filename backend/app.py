import asyncio
import threading
import socketio
import uvicorn
import time

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException,  status
from fastapi.middleware.cors import CORSMiddleware
from repositories.DataRepository import DataRepository
from models.models import Match, Matchen, Serve, Serves, Speler, Spelers, Device, Devices, OpstellingSpeler, OpstellingSpelers
from RPi import GPIO
from datetime import date, datetime


# TODO: Add logging
import logging
logging.basicConfig(
    level=logging.INFO,                    # alles ≥ INFO‑niveau tonen
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",         # Europees datum‑formaat
    force=True,                           # herconfigureer bij auto‑reload
)
logger = logging.getLogger(__name__)



# TODO: Add hardware constants
LED_PIN    = 21
BUTTON_PIN = 20

# TODO: global variables (like led_state)
led_state = False  # globale staat bovenaan
async_loop = None

# ----------------------------------------------------
# App setup
# ----------------------------------------------------

# Create a FastAPI app, add CORS middleware, initialize Socket.IO server + ASGI app, create async queue for messages
app = FastAPI(title="VolleyVision", debug=True, description="VolleyVision", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
sio = socketio.AsyncServer(cors_allowed_origins='*', async_mode='asgi', logger=True)
sio_app = socketio.ASGIApp(sio, app)

ENDPOINT = "/api/v1"  # Define the endpoint for the API



# ----------------------------------------------------
# Background Tasks
# ----------------------------------------------------


# ----------------------------------------------------
# FastAPI Endpoints
# ----------------------------------------------------

@app.get(ENDPOINT + "/matchen", response_model=Matchen, summary="Ophalen van alle matchen")
async def read_alle_matchen():
    data = DataRepository.read_alle_matchen()
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="matchen niet gevonden")

    list_matchen = []
    for item in data:
        match = Match(match_id=int(item["match_id"]), match_naam=item["match_naam"], datum=item["datum"], locatie=item["locatie"])
        list_matchen.append(match)

    return Matchen(matchen=list_matchen)

@app.get(ENDPOINT + "/serves", response_model=Serves, summary="Ophalen van alle serves")
async def read_alle_serves():
    data = DataRepository.read_alle_serves()
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="serves niet gevonden")
    
    list_serves = []
    for item in data:
        serve = Serve(serve_id=int(item["serve_id"]), speler_id=int(item["speler_id"]), match_id=int(item["match_id"]), start_tijd=item["start_tijd"], eind_tijd=item["eind_tijd"])
        list_serves.append(serve)
        
    return Serves(serves=list_serves)

@app.get(ENDPOINT + "/spelers", response_model=Spelers, summary="Ophalen van alle spelers")
async def read_alle_spelers():
    data = DataRepository.read_alle_spelers()
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spelers niet gevonden")
    
    list_spelers = []
    for item in data:
        speler = Speler(speler_id=int(item["speler_id"]), naam=item["naam"], voornaam=item["voornaam"], rugnummer=int(item["rugnummer"]), positie=item["positie"], active=int(item["active"]))
        list_spelers.append(speler)
        
    return Spelers(spelers=list_spelers)

@app.get(ENDPOINT + "/spelers/actief", response_model=Spelers, summary="Ophalen van alle actieve spelers")
async def read_alle_actieve_spelers():
    data = DataRepository.read_alle_actieve_spelers()
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spelers niet gevonden")
    
    list_spelers = []
    for item in data:
        speler = Speler(speler_id=int(item["speler_id"]), naam=item["naam"], voornaam=item["voornaam"], rugnummer=int(item["rugnummer"]), positie=item["positie"], active=int(item["active"]))
        list_spelers.append(speler)
        
    return Spelers(spelers=list_spelers)

@app.get(ENDPOINT + "/devices", response_model=Devices, summary="Ophalen van alle devices")
async def read_alle_devices():
    data = DataRepository.read_alle_devices()
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devices niet gevonden")
    
    list_devices = []
    for item in data:
        device = Device(device_id=int(item["device_id"]), device_type_id=int(item["device_type_id"]), naam=item["naam"], beschrijving=item["beschrijving"])
        list_devices.append(device)
        
    return Devices(devices=list_devices)

@app.get(ENDPOINT + "/opstelling", response_model=OpstellingSpelers, summary="Ophalen van alle match opstellingen")
async def read_alle_match_opstellingen():
    data = DataRepository.read_alle_match_opstellingen()
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opstellingen niet gevonden")
    
    list_opstellingen = []
    for item in data:
        opstelling = OpstellingSpeler(match_id=int(item["match_id"]), naam=item["naam"], voornaam=item["voornaam"], rugnummer=int(item["rugnummer"]), veld_positie=int(item["veld_positie"]))
        list_opstellingen.append(opstelling)
        
    return OpstellingSpelers(Speler_opstellingen=list_opstellingen)

@app.get(ENDPOINT + "/opstelling/{match_id}", response_model=OpstellingSpelers, summary="Ophalen van match opstelling met match id")
async def read_match_opstelling(match_id: int):
    data = DataRepository.read_opstelling_by_match_id(match_id)
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match niet gevonden")
    
    list_opstellingen = []
    for item in data:
        opstelling = OpstellingSpeler(match_id=int(item["match_id"]), naam=item["naam"], voornaam=item["voornaam"], rugnummer=int(item["rugnummer"]), veld_positie=int(item["veld_positie"]))
        list_opstellingen.append(opstelling)
        
    return OpstellingSpelers(Speler_opstellingen=list_opstellingen)

# ----------------------------------------------------
# Socket.IO Handlers
# ----------------------------------------------------

# ----------------------------------------------------
# Run the app
# ----------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("app:sio_app", host="0.0.0.0", port=8000, log_level="info", reload=True, reload_dirs=["backend"])
