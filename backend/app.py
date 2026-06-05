import asyncio
import threading
import socketio
import uvicorn
import time

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException,  status
from fastapi.middleware.cors import CORSMiddleware
from repositories.DataRepository import DataRepository
from models.models import Match, Matchen, Serve, Serves, Speler, Spelers, Device, Devices, OpstellingSpeler, OpstellingSpelers, Instelling, Instellingen, DTOMatch, DTOSpeler, DTOOpstelling, DTOServe, DTOSensorEvent, SensorEvent, SensorEvents, DTOInstelling, DTOPatchOpstelling, DTOPatchSpeler
# from RPi import GPIO
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

# Read

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

@app.get(ENDPOINT + "/matchen/{match_id}", response_model=Match, summary="Ophalen van match met match id")
async def read_match_by_id(match_id: int):
    data = DataRepository.read_match_by_id(match_id)
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="match niet gevonden")

    return Match(match_id=int(data["match_id"]), match_naam=data["match_naam"], datum=data["datum"], locatie=data["locatie"])

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

@app.get(ENDPOINT + "/serves/{serve_id}", response_model=Serve, summary="Ophalen van serve met id")
async def read_serve_by_id(serve_id: int):
    data = DataRepository.read_serve_by_id(serve_id)
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="serve niet gevonden")
        
    return Serve(serve_id=int(data["serve_id"]), speler_id=int(data["speler_id"]), match_id=int(data["match_id"]), start_tijd=data["start_tijd"], eind_tijd=data["eind_tijd"])

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

@app.get(ENDPOINT + "/spelers/{speler_id}", response_model=Speler, summary="Ophalen van speler met speler id")
async def read_speler_by_id(speler_id: int):
    data = DataRepository.read_speler_by_id(speler_id)
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Speler niet gevonden")
        
    return Speler(speler_id=int(data["speler_id"]), naam=data["naam"], voornaam=data["voornaam"], rugnummer=int(data["rugnummer"]), positie=data["positie"], active=int(data["active"]))

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

@app.get(ENDPOINT + "/instellingen", response_model=Instellingen, summary="Ophalen van alle instellingen")
async def read_alle_instellingen():
    data = DataRepository.read_alle_instellingen()
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instellingen niet gevonden")
    
    list_instellingen = []
    for item in data:
        instelling = Instelling(instelling_id=int(item["setting_id"]), naam=item["setting_naam"], value=item["setting_value"])
        list_instellingen.append(instelling)
        
    return Instellingen(instellingen=list_instellingen)

@app.get(ENDPOINT + "/instellingen/{instelling_id}", response_model=Instelling, summary="Ophalen van een instelling met id")
async def read_instelling(instelling_id: int):
    data = DataRepository.read_instelling_by_id(instelling_id)
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instelling niet gevonden")

    return Instelling(instelling_id=int(data["setting_id"]), naam=data["setting_naam"], value=data["setting_value"])

# Toevoegen

@app.post(ENDPOINT + "/matchen", response_model=Match, summary="Match toevoegen")
async def add_match(match_gegevens: DTOMatch):
    response_id = DataRepository.add_match(match_gegevens.match_naam, datetime.now().date(), match_gegevens.locatie)
    
    if not response_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match niet gevonden")
    
    data = DataRepository.read_match_by_id(response_id)
    
    if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match niet gevonden")
            
    return Match(match_id=int(data["match_id"]), match_naam=data["match_naam"], datum=data["datum"], locatie=data["locatie"])

@app.post(ENDPOINT + "/spelers", response_model=Speler, summary="Speler toevoegen")
async def add_speler(speler_gegevens: DTOSpeler):
    response_id = DataRepository.add_speler(speler_gegevens.naam, speler_gegevens.voornaam, speler_gegevens.rugnummer, speler_gegevens.positie)
    
    if not response_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Speler niet gevonden")
    
    data = DataRepository.read_speler_by_id(response_id)
    
    if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Speler niet gevonden")
            
    return Speler(speler_id=int(data["speler_id"]), naam=data["naam"], voornaam=data["voornaam"], rugnummer=int(data["rugnummer"]), positie=data["positie"], active=int(data["active"]))

@app.post(ENDPOINT + "/opstelling", response_model=OpstellingSpelers, summary="Opstelling speler toevoegen")
async def add_opstelling(opstelling_gegevens: DTOOpstelling):
    response_id = DataRepository.add_opstelling(opstelling_gegevens.match_id, opstelling_gegevens.speler_id, opstelling_gegevens.veld_positie)
    
    if not response_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opstelling speler niet gevonden")
    
    data = DataRepository.read_opstelling_by_match_id(opstelling_gegevens.match_id)
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match niet gevonden")
    
    list_opstellingen = []
    for item in data:
        opstelling = OpstellingSpeler(match_id=int(item["match_id"]), naam=item["naam"], voornaam=item["voornaam"], rugnummer=int(item["rugnummer"]), veld_positie=int(item["veld_positie"]))
        list_opstellingen.append(opstelling)
        
    return OpstellingSpelers(Speler_opstellingen=list_opstellingen)

@app.post(ENDPOINT + "/serves", response_model=Serve, summary="Serve toevoegen")
async def add_serve(serve_gegevens: DTOServe):
    response_id = DataRepository.add_serve(serve_gegevens.speler_id, serve_gegevens.match_id, serve_gegevens.start_tijd, serve_gegevens.eind_tijd)

    if not response_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serve niet gevonden")

    data = DataRepository.read_serve_by_id(response_id)

    if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serve niet gevonden")

    return Serve(serve_id=int(data["serve_id"]), speler_id=int(data["speler_id"]), match_id=int(data["match_id"]), start_tijd=data["start_tijd"], eind_tijd=data["eind_tijd"])
    
@app.post(ENDPOINT + "/sensorevents", response_model=SensorEvent, summary="Sensorevent toevoegen")
async def add_sensorevent(sensorevents_gegevens: DTOSensorEvent):
    response_id = DataRepository.add_sensorevent(sensorevents_gegevens.serve_id, sensorevents_gegevens.device_id, sensorevents_gegevens.waarde, sensorevents_gegevens.event_tijd)

    if not response_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensorevent niet gevonden")

    data = DataRepository.read_sensorevent_by_id(response_id)

    if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensorevent niet gevonden")

    return SensorEvent(event_id=int(data["event_id"]), serve_id=int(data["serve_id"]), device_id=int(data["device_id"]), waarde=float(data["waarde"]), event_tijd=data["event_tijd"])

# Updaten

@app.put(ENDPOINT + "/spelers/{speler_id}", response_model=Speler, summary="Speler gegevens updaten")
async def update_speler(speler_id: int, speler_gegevens: DTOSpeler):
    response_id = DataRepository.update_speler(speler_gegevens.naam, speler_gegevens.voornaam, speler_gegevens.rugnummer, speler_gegevens.positie, speler_id)

    if not response_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Geen gevens om te updaten")

    data = DataRepository.read_speler_by_id(speler_id)

    if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Speler niet gevonden")

    return Speler(speler_id=int(data["speler_id"]), naam=data["naam"], voornaam=data["voornaam"], rugnummer=int(data["rugnummer"]), positie=data["positie"], active=int(data["active"]))

@app.put(ENDPOINT + "/instellingen/{instelling_id}", response_model=Instelling, summary="Instellingen updaten")
async def update_instelling(instelling_id: int, instelling_gegevens: DTOInstelling):
    response_id = DataRepository.update_instelling(instelling_gegevens.naam, instelling_gegevens.value, instelling_id)
    if not response_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Geen instelling om te updaten")

    data = DataRepository.read_instelling_by_id(instelling_id)

    if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instelling niet gevonden")

    return Instelling(instelling_id=int(data["setting_id"]), naam=data["setting_naam"], value=data["setting_value"])


# Aanpassen van 1 bepaald iets

@app.patch(ENDPOINT + "/opstelling/matchen/{match_id}/spelers/{speler_id}", response_model=OpstellingSpelers, summary="Spelers wisselen. Speler uit/in de opstelling halen")
async def patch_opstelling(match_id: int, speler_id: int, opstelling_gegevens: DTOPatchOpstelling):
    response_id = DataRepository.patch_opstelling(opstelling_gegevens.veld_positie, match_id, speler_id)
    
    if not response_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Geen opstelling om te updaten")
    
    data = DataRepository.read_opstelling_by_match_id(match_id)
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match niet gevonden")
    
    list_opstellingen = []
    for item in data:
        opstelling = OpstellingSpeler(match_id=int(item["match_id"]), naam=item["naam"], voornaam=item["voornaam"], rugnummer=int(item["rugnummer"]), veld_positie=int(item["veld_positie"]))
        list_opstellingen.append(opstelling)
        
    return OpstellingSpelers(Speler_opstellingen=list_opstellingen)

@app.patch(ENDPOINT + "/spelers/{speler_id}", response_model=Speler, summary="Speler actief status aanpassen")
async def patch_speler(speler_id: int, speler_gegevens: DTOPatchSpeler):
    response_id = DataRepository.patch_speler(speler_gegevens.actief, speler_id)
    
    if not response_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Geen speler gegevens om te veranderen")

    data = DataRepository.read_speler_by_id(speler_id)

    if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Speler niet gevonden")

    return Speler(speler_id=int(data["speler_id"]), naam=data["naam"], voornaam=data["voornaam"], rugnummer=int(data["rugnummer"]), positie=data["positie"], active=int(data["active"]))
    
# ----------------------------------------------------
# Socket.IO Handlers
# ----------------------------------------------------

# ----------------------------------------------------
# Run the app
# ----------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("app:sio_app", host="0.0.0.0", port=8000, log_level="info", reload=True, reload_dirs=["backend"])
