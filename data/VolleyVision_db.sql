DROP DATABASE IF EXISTS volleyvision;
CREATE DATABASE volleyvision;
USE volleyvision;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `devicetypes` (
  `device_type_id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`device_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `devices` (
  `device_id` int NOT NULL AUTO_INCREMENT,
  `device_type_id` int DEFAULT NULL,
  `naam` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `beschrijving` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`device_id`),
  KEY `fk_device_type_id_idx` (`device_type_id`),
  CONSTRAINT `fk_device_type_id` 
    FOREIGN KEY (`device_type_id`) 
    REFERENCES `devicetypes` (`device_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `matchen` (
  `match_id` int NOT NULL AUTO_INCREMENT,
  `datum` date DEFAULT NULL,
  `locatie` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `active` tinyint DEFAULT '1',
  PRIMARY KEY (`match_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `spelers` (
  `speler_id` int NOT NULL AUTO_INCREMENT,
  `naam` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `voornaam` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `rugnummer` int DEFAULT NULL,
  `positie` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `active` tinyint DEFAULT '1',
  PRIMARY KEY (`speler_id`),
  UNIQUE KEY `unieke_speler` (`naam`, `voornaam`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `opstellingen` (
  `match_id` int DEFAULT NULL,
  `speler_id` int DEFAULT NULL,
  `veld_positie` int DEFAULT NULL,
  KEY `fk_match_id_idx` (`match_id`),
  KEY `fk_speler_id_idx` (`speler_id`),
  CONSTRAINT `fk_match_id` 
    FOREIGN KEY (`match_id`) 
    REFERENCES `matchen` (`match_id`),
  CONSTRAINT `fk_speler_id` 
    FOREIGN KEY (`speler_id`) 
    REFERENCES `spelers` (`speler_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `serves` (
  `serve_id` int NOT NULL AUTO_INCREMENT,
  `speler_id` int DEFAULT NULL,
  `match_id` int DEFAULT NULL,
  `start_tijd` datetime DEFAULT NULL,
  `eind_tijd` datetime DEFAULT NULL,
  `voetfout` tinyint DEFAULT '0',
  PRIMARY KEY (`serve_id`),
  KEY `fk_spelerid_idx` (`speler_id`),
  KEY `fk_matchid_idx` (`match_id`),
  CONSTRAINT `fk_matchid` 
    FOREIGN KEY (`match_id`) 
    REFERENCES `matchen` (`match_id`),
  CONSTRAINT `fk_spelerid` 
    FOREIGN KEY (`speler_id`) 
    REFERENCES `spelers` (`speler_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `sensorevents` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `serve_id` int DEFAULT NULL,
  `device_id` int DEFAULT NULL,
  `waarde` float DEFAULT NULL,
  `event_tijd` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  KEY `fk_serveid` (`serve_id`),
  KEY `fk_deviceid_idx` (`device_id`),
  CONSTRAINT `fk_deviceid` 
    FOREIGN KEY (`device_id`) 
    REFERENCES `devices` (`device_id`),
  CONSTRAINT `fk_serveid` 
    FOREIGN KEY (`serve_id`) 
    REFERENCES `serves` (`serve_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `settings` (
  `setting_id` int NOT NULL AUTO_INCREMENT,
  `setting_naam` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `setting_value` int DEFAULT NULL,
  PRIMARY KEY (`setting_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;