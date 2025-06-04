FROM eclipse-mosquitto:2

COPY mosquitto.conf /mosquitto/config/mosquitto.conf
COPY mosquitto.passwd /mosquitto/config/passwd

RUN chmod 644 /mosquitto/config/passwd

EXPOSE 1883 9001