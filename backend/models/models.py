from pydantic import BaseModel
from datetime import date, datetime

class Match(BaseModel):
    match_id: int
    datum: date
    locatie: str
    opslag_wij: int
    active: int
    
class Matchen(BaseModel):
    matchen: list[Match]
    
class Serve(BaseModel):
    serve_id: int
    speler_id: int
    match_id: int
    start_tijd: datetime
    eind_tijd: datetime
    
class Serves(BaseModel):
    serves: list[Serve]
    
class Speler(BaseModel):
    speler_id: int
    naam: str
    voornaam: str
    rugnummer: int
    positie: str
    active: int | None
    
class Spelers(BaseModel):
    spelers: list[Speler]
    
class Device(BaseModel):
    device_id: int
    device_type_id: int
    naam: str
    beschrijving: str
    
class Devices(BaseModel):
    devices: list[Device]
    
class DeviceType(BaseModel):
    device_type_id: int
    type: str
    
class DeviceTypes(BaseModel):
    device_types: list[DeviceType]
    
class OpstellingSpeler(BaseModel):
    match_id: int
    speler_id: int
    naam: str
    voornaam: str
    rugnummer: int
    veld_positie: int
    
class OpstellingSpelers(BaseModel):
    Speler_opstellingen: list[OpstellingSpeler]
    
class Instelling(BaseModel):
    instelling_id: int
    naam: str
    value: int
    
class Instellingen(BaseModel):
    instellingen: list[Instelling]
    
class DTOMatch(BaseModel):
    locatie: str
    opslag_wij: int
    
class DTOSpeler(BaseModel):
    naam: str
    voornaam: str
    rugnummer: int
    positie: str
    
class DTOOpstelling(BaseModel):
    match_id: int
    speler_id: int
    veld_positie: int
    
class DTOServe(BaseModel):
    speler_id: int
    match_id: int
    start_tijd: datetime
    eind_tijd: datetime
    
class DTOSensorEvent(BaseModel):
    serve_id: int
    device_id: int
    waarde: float
    event_tijd: datetime
    
class SensorEvent(BaseModel):
    event_id: int
    serve_id: int
    device_id: int
    waarde: str
    event_tijd: datetime
    
class SensorEvents(BaseModel):
    sensorevents: list[SensorEvent]
    
class DTOInstelling(BaseModel):
    instelling_id: int
    value: int
    
class DTOInstellingen(BaseModel):
    instellingen: list[DTOInstelling]
    
class DTOPatchOpstelling(BaseModel):
    veld_positie: int
    
class DTOPatchSpeler(BaseModel):
    actief: int
    
class LastMatch(BaseModel):
    match_id: int
    active: int