from .Database import Database


class DataRepository:
    @staticmethod
    def read_alle_matchen():
        sql = "SELECT * FROM Matchen"
        return Database.get_rows(sql)
    
    @staticmethod
    def read_match_by_id(match_id):
        sql = "SELECT * FROM Matchen WHERE match_id = %s"
        params = [match_id]
        return Database.get_one_row(sql, params)

    @staticmethod
    def read_alle_serves():
        sql = "SELECT * FROM Serves"
        return Database.get_rows(sql)
    
    @staticmethod
    def read_serve_by_id(serve_id):
        sql = "SELECT * FROM Serves WHERE serve_id = %s"
        params = [serve_id]
        return Database.get_one_row(sql, params)
    
    @staticmethod
    def read_alle_spelers():
        sql = "SELECT * FROM Spelers"
        return Database.get_rows(sql)
    
    @staticmethod
    def read_speler_by_id(speler_id):
        sql = "SELECT * FROM Spelers WHERE speler_id = %s"
        params = [speler_id]
        return Database.get_one_row(sql, params)
    
    @staticmethod
    def read_alle_actieve_spelers():
        sql = "SELECT * FROM Spelers WHERE active = 1"
        return Database.get_rows(sql)

    @staticmethod
    def read_alle_devices():
        sql = "SELECT * FROM Devices"
        return Database.get_rows(sql)
    
    @staticmethod
    def read_alle_match_opstellingen():
        sql = "SELECT o.match_id, s.naam, s.voornaam, s.rugnummer, o.veld_positie FROM Opstelling o INNER JOIN Spelers s ON o.speler_id = s.speler_id"
        return Database.get_rows(sql)
    
    @staticmethod
    def read_opstelling_by_match_id(match_id):
        sql = "SELECT o.match_id, s.naam, s.voornaam, s.rugnummer, o.veld_positie FROM Opstelling o INNER JOIN Spelers s ON o.speler_id = s.speler_id WHERE o.match_id = %s"
        params = [match_id]
        return Database.get_rows(sql, params)
    
    @staticmethod
    def read_alle_instellingen():
        sql = "SELECT * FROM settings"
        return Database.get_rows(sql)
    
    @staticmethod
    def read_instelling_by_id(instelling_id):
        sql = "SELECT * FROM settings WHERE setting_id = %s"
        params = [instelling_id]
        return Database.get_one_row(sql, params)
    
    @staticmethod
    def add_match(match_naam, datum, locatie):
        sql = "INSERT INTO matchen (match_naam, datum, locatie) VALUES (%s, %s, %s)"
        params = [match_naam, datum, locatie]
        return Database.execute_sql(sql, params)
    
    @staticmethod
    def add_speler(naam, voornaam, rugnummer, positie):
        sql = "INSERT INTO spelers (naam, voornaam, rugnummer, positie, active) VALUES (%s, %s, %s, %s, 1)"
        params = [naam, voornaam, rugnummer, positie]
        return Database.execute_sql(sql, params)
    
    @staticmethod
    def add_opstelling(match_id, speler_id, veld_positie):
        sql = "INSERT INTO opstelling (match_id, speler_id, veld_positie) VALUES (%s, %s, %s)"
        params = [match_id, speler_id, veld_positie]
        return Database.execute_sql(sql, params)
    
    @staticmethod
    def add_serve(speler_id, match_id, start_tijd, eind_tijd):
        sql = "INSERT INTO serves (speler_id, match_id, start_tijd, eind_tijd) VALUES (%s, %s, %s, %s)"
        params = [speler_id, match_id, start_tijd, eind_tijd]
        return Database.execute_sql(sql, params)
    
    @staticmethod
    def add_sensorevent(serve_id, device_id, waarde, event_tijd):
        sql = "INSERT INTO sensorevents (serve_id, device_id, waarde, event_tijd) VALUES (%s, %s, %s, %s)"
        params = [serve_id, device_id, waarde, event_tijd]
        return Database.execute_sql(sql, params)
    
    @staticmethod
    def read_sensorevent_by_id(event_id):
        sql = "SELECT * FROM sensorevents WHERE event_id = %s"
        params = [event_id]
        return Database.get_one_row(sql, params)
    
    @staticmethod
    def read_alle_sensorevents():
        sql = "SELECT * FROM sensorevents"
        return Database.get_rows(sql)