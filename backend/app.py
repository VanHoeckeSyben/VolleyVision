import asyncio
import threading
import socketio
import uvicorn
import time

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException,  status
from fastapi.middleware.cors import CORSMiddleware
from repositories.DataRepository import DataRepository
from models.models import Match, Matchen, Serve, Serves, Speler, Spelers, Device, Devices, DeviceType, DeviceTypes, OpstellingSpeler, OpstellingSpelers, Instelling, Instellingen, DTOMatch, DTOSpeler, DTOOpstelling, DTOServe, DTOSensorEvent, SensorEvent, SensorEvents, DTOInstelling, DTOPatchOpstelling, DTOPatchSpeler
from RPi import GPIO
from datetime import date, datetime
from bluedot.btcomm import BluetoothClient


# logging
import logging
logging.basicConfig(
    level=logging.INFO,                    # alles ≥ INFO‑niveau tonen
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",         # Europees datum‑formaat
    force=True,                           # herconfigureer bij auto‑reload
)
logger = logging.getLogger(__name__)



# constants
LED = 6
KNOP1 = 5
KNOP2 = 17

# global variables
led_state = True  # globale staat bovenaan
async_loop = None
serve_actief = False
teller_serve_id = 1
device_id = -1
druk_actief = False
max_spelers = 12

# ----------------------------------------------------
# App setup
# ----------------------------------------------------

@asynccontextmanager
# Lifespan Manager (Startup/Shutdown)
async def lifespan_manager(app: FastAPI):
    global async_loop
    # Start background taken (process_queue + all_out) op in de applicatie
    async_loop = asyncio.get_running_loop()

    GPIO.setmode(GPIO.BCM)
    GPIO.setup(LED,GPIO.OUT)
    GPIO.setup(KNOP1, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.setup(KNOP2, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    logger.info("GPIO initialised")
    threading.Thread(
    target=gpio_keep_alive,
    daemon=True               # 🔑 daemon‑threads stoppen automatisch bij app‑exit
    ).start()

    # Geef controle aan FastAPI/Socket.IO
    yield

    # TODO: GPIO cleanup and goodbye
    GPIO.cleanup()
    logger.info("GPIO cleaned up – bye!")


# Create a FastAPI app, add CORS middleware, initialize Socket.IO server + ASGI app, create async queue for messages
app = FastAPI(title="VolleyVision", debug=True, description="VolleyVision", version="1.0", lifespan=lifespan_manager)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
sio = socketio.AsyncServer(cors_allowed_origins='*', async_mode='asgi', logger=True)
sio_app = socketio.ASGIApp(sio, app)

ENDPOINT = "/api/v1"  # Define the endpoint for the API

# ----------------------------------------------------
# Background Tasks
# ----------------------------------------------------

def gpio_keep_alive():
    global serve_actief
    global teller_serve_id
    def data_received(data):
        global druk_actief
        data = str(data).strip()

        regels = data.split("\n")
    
        for regel in regels:
            regel = regel.strip()
            if ":" not in regel:
                continue
            
            sensor, value = regel.split(":", 1)
            print(regel)

            asyncio.run_coroutine_threadsafe(sio.emit("B2F_verandering_sensoren", {"sensornaam": sensor, "value": value}),async_loop)
        
            if sensor == "Druksensor": 
                device_id = 1
                if value != "0N" and not druk_actief:
                    druk_actief = True
                    if serve_actief:
                        DataRepository.add_sensorevent(serve_id=teller_serve_id, device_id=device_id, waarde=value, event_tijd=datetime.now())
                        asyncio.run_coroutine_threadsafe(sio.emit("B2F_verandering_database", {}),async_loop)
                elif value == "0N" and serve_actief:
                    druk_actief = False
                    if serve_actief:
                        DataRepository.add_sensorevent(serve_id=teller_serve_id, device_id=device_id, waarde=0, event_tijd=datetime.now())
                        asyncio.run_coroutine_threadsafe(sio.emit("B2F_verandering_database", {}),async_loop)
                        
            if sensor == "Lasersensor": 
                device_id = 2
                if serve_actief:
                    DataRepository.add_sensorevent(serve_id=teller_serve_id, device_id=device_id, waarde=value, event_tijd=datetime.now())
                    asyncio.run_coroutine_threadsafe(sio.emit("B2F_verandering_database", {}),async_loop)
            if sensor == "Geluidsensor": 
                device_id = 3
                if serve_actief:
                    DataRepository.add_sensorevent(serve_id=teller_serve_id, device_id=device_id, waarde=value, event_tijd=datetime.now())
                    asyncio.run_coroutine_threadsafe(sio.emit("B2F_verandering_database", {}),async_loop)

    c = None

    try:
        c = BluetoothClient("ESP32_VolleyVision", data_received)
        
        while True:
            status_knop1 = not GPIO.input(KNOP1)

            if status_knop1 and not serve_actief:
                serve_actief = True
                GPIO.output(LED, GPIO.LOW)
                
                start_tijd = datetime.now()

                teller = 0
                while teller < 80 and not not GPIO.input(KNOP2):
                    time.sleep(0.1)
                    teller += 1

                serve_actief = False
                eind_tijd = datetime.now()
                GPIO.output(LED, GPIO.HIGH)
                
                teller_serve_id = DataRepository.add_serve(speler_id=1, match_id=1, start_tijd=start_tijd, eind_tijd=eind_tijd)
                asyncio.run_coroutine_threadsafe(sio.emit("B2F_verandering_database", {}),async_loop)

            time.sleep(0.1)

    except KeyboardInterrupt:
        print("Gestopt door keyboard")

    finally:
        if c:
            c.disconnect()

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

@app.get(ENDPOINT + "/actievespelers", response_model=Spelers, summary="Ophalen van alle actieve spelers")
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

@app.get(ENDPOINT + "/devicetypes", response_model=DeviceTypes, summary="Ophalen van alle device types")
async def read_alle_device_types():
    data = DataRepository.read_alle_device_types()
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device types niet gevonden")
    
    list_device_types = []
    for item in data:
        device_type = DeviceType(device_type_id=int(item["device_type_id"]), type=item["type"])
        list_device_types.append(device_type)
        
    return DeviceTypes(device_types=list_device_types)

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

@app.get(ENDPOINT + "/sensorevents", response_model=SensorEvents, summary="Ophalen van alle sensor events")
async def read_alle_sensor_events():
    data = DataRepository.read_alle_sensor_events()
    
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor events niet gevonden")
    
    list_sensor_events = []
    for item in data:
        sensor_event = SensorEvent(event_id=int(item["event_id"]), serve_id=int(item["serve_id"]), device_id=int(item["device_id"]), waarde=item["waarde"], event_tijd=item["event_tijd"])
        list_sensor_events.append(sensor_event)
        
    return SensorEvents(sensorevents=list_sensor_events)

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
    if (speler_gegevens.naam == "" or speler_gegevens.voornaam == "" or speler_gegevens.positie == ""):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Gegevens mogen niet leeg zijn")
    
    if (any(char.isdigit() for char in speler_gegevens.naam) or any(char.isdigit() for char in speler_gegevens.voornaam)):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Gegevens moeten geldig zijn (Geen cijfers in namen)")
    
    active_spelers = DataRepository.count_active_spelers()
    
    if (active_spelers["count"] >= max_spelers):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum aantal spelers in een team bereikt (12)")
    
    check_speler = DataRepository.search_player_with_name(speler_gegevens.voornaam, speler_gegevens.naam)
    print(check_speler)
    
    if check_speler:
    
        if (check_speler["active"] == 0):
            response_id = DataRepository.patch_speler(actief=1, speler_id=check_speler["speler_id"])
    else:
        response_id = DataRepository.add_speler(speler_gegevens.naam, speler_gegevens.voornaam, speler_gegevens.rugnummer, speler_gegevens.positie)
    
    if not response_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Speler niet gevonden")
    
    data = DataRepository.read_speler_by_id(response_id)
    
    if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Speler niet gevonden")
        
    await sio.emit('B2F_nieuwe_speler', {})
            
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
        
    await sio.emit('B2F_update_speler', {})

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
        
    await sio.emit('B2F_delete_speler', {})

    return Speler(speler_id=int(data["speler_id"]), naam=data["naam"], voornaam=data["voornaam"], rugnummer=int(data["rugnummer"]), positie=data["positie"], active=int(data["active"]))
    
# ----------------------------------------------------
# Socket.IO Handlers
# ----------------------------------------------------

@sio.event
async def connect(sid, environ):
    print("A new client connected")

    await sio.emit('B2F_connected', sid)

# ----------------------------------------------------
# Run the app
# ----------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("app:sio_app", host="0.0.0.0", port=8000, log_level="info", reload=True, reload_dirs=["backend"])
