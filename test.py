from RPi import GPIO
import time

PIN = 27
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN, GPIO.OUT)
pwm = GPIO.PWM(PIN, 100)
pwm.start(50)

pwm.ChangeDutyCycle(80)
pwm.ChangeFrequency(120)
time.sleep(2.5)

pwm.ChangeDutyCycle(0)
pwm.stop()
GPIO.cleanup()