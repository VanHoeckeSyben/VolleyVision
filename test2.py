import board
import neopixel
import time

LED_COUNT = 31
SKIP_LEDS = 3
PIN = board.D18

strip = neopixel.NeoPixel(PIN, LED_COUNT, brightness=0.5, auto_write=False)

def alles_uit():
    for i in range(SKIP_LEDS, LED_COUNT):
        strip[i] = (0, 0, 0)
    strip.show()

def alles_aan(color):
    for i in range(SKIP_LEDS, LED_COUNT):
        strip[i] = color
    strip.show()

# Test
print("Rood aan...")
alles_aan((255, 0, 0))
time.sleep(2)

print("Chase groen...")
alles_uit()
for i in range(SKIP_LEDS, LED_COUNT):
    strip[i] = (0, 255, 0)
    strip.show()
    time.sleep(0.1)
    strip[i] = (0, 0, 0)
    strip.show()

alles_uit()
print("Klaar!")