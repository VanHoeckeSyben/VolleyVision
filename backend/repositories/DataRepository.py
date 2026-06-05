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