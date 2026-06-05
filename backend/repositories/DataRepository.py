from .Database import Database


class DataRepository:
    @staticmethod
    def read_alle_matchen():
        sql = "SELECT * FROM Matchen"
        return Database.get_rows(sql)

    @staticmethod
    def read_alle_serves():
        sql = "SELECT * FROM Serves"
        return Database.get_rows(sql)
    
    @staticmethod
    def read_alle_spelers():
        sql = "SELECT * FROM Spelers"
        return Database.get_rows(sql)
    
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
        return Database.get_one_row(sql, params)
    
    @staticmethod
    def read_alle_instellingen():
        sql = "SELECT * FROM settings"
        return Database.get_rows(sql)
    
    @staticmethod
    def read_instelling_by_id(instelling_id):
        sql = "SELECT * FROM settings WHERE setting_id = %s"
        params = [instelling_id]
        return Database.get_one_row(sql, params)