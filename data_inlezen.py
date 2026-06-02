from bluedot.btcomm import BluetoothClient
from signal import pause

try:
    while True:
        def data_received(data):
            print(data)
        c = BluetoothClient("ESP32_VolleyVision", data_received)
        
        pause()

except KeyboardInterrupt:
    print("Gestopt door keyboard")

finally:
    c.disconnect()