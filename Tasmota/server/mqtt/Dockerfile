FROM eclipse-mosquitto:2

COPY mosquitto.conf /mosquitto/config/mosquitto.conf
COPY mosquitto.passwd /mosquitto/config/passwd

# Fix ownership and permissions
RUN chown mosquitto:mosquitto /mosquitto/config/passwd \
    && chmod 0600 /mosquitto/config/passwd

EXPOSE 1883 9001