from pydantic import BaseModel
from datetime import date, datetime

class Match(BaseModel):
    match_id: int
    match_naam: str
    datum: date
    locatie: str
    
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