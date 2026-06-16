from smbus import SMBus
from time import sleep

lcd_chr = 1
lcd_cmd = 0

enable = 0b00000100
backlight = 0b00001000


class LCD:
    def __init__(self, addr=0x27, bus=1):
        self.addr = addr
        self.bus = SMBus(bus)
        self.init_lcd()

    def write_byte(self, data):
        self.bus.write_byte(self.addr, data | backlight)

    def toggle_enable(self, data):
        sleep(0.0005)
        self.write_byte(data | enable)
        sleep(0.0005)
        self.write_byte(data & ~enable)
        sleep(0.0005)

    def send_byte(self, bits, mode):
        high = mode | (bits & 0xF0)
        low = mode | ((bits << 4) & 0xF0)

        self.write_byte(high)
        self.toggle_enable(high)

        self.write_byte(low)
        self.toggle_enable(low)

    def init_lcd(self):
        self.send_byte(0x33, lcd_cmd)
        self.send_byte(0x32, lcd_cmd)
        self.send_byte(0x28, lcd_cmd)
        self.send_byte(0x0C, lcd_cmd)
        self.send_byte(0x06, lcd_cmd)
        self.clear()

    def clear(self):
        self.send_byte(0x01, lcd_cmd)
        sleep(0.002)

    def message(self, text, line):
        if line == 1:
            line = 0x80
        elif line == 2:
            line = 0xC0
        
        text = text.ljust(16, " ")
        self.send_byte(line, lcd_cmd)

        for char in text[:16]:
            self.send_byte(ord(char), lcd_chr)