from RPi import GPIO
import time

PIN = 27
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN, GPIO.OUT)
pwm = GPIO.PWM(PIN, 440)
pwm.start(50)

E5=659; C5=523; G4=392; A4=440
F4=349; G5=784; B4=494; F5=698
D5=587; E4=330; A3=220; AS3=233
AS4=466; GS4=415; DS4=311; DS5=622

melodie = [
    (E5, 0.15), (E5, 0.15), (0, 0.15),
    (E5, 0.15), (0, 0.15),
    (C5, 0.15), (E5, 0.20),
    (G4, 0.40), (0, 0.40),

    (G4, 0.40), (0, 0.40),

    (C5, 0.30), (0, 0.20),
    (G4, 0.20), (0, 0.20),
    (E4, 0.30), (0, 0.20),

    (A4, 0.20), (0, 0.10),
    (B4, 0.20), (0, 0.10),
    (AS4, 0.15), (A4, 0.20),

    (G4, 0.20), (E5, 0.20), (G5, 0.20),
    (A4, 0.20),
    (F5, 0.15), (G5, 0.15),
    (0, 0.10), (E5, 0.20),
    (C5, 0.15), (D5, 0.15), (B4, 0.20),
]

for noot, duur in melodie:
    if noot == 0:
        pwm.ChangeDutyCycle(0)  # ← stilte: duty cycle 0 in plaats van stop/start
    else:
        pwm.ChangeDutyCycle(50)
        pwm.ChangeFrequency(noot)
    time.sleep(duur)

pwm.stop()
GPIO.cleanup()