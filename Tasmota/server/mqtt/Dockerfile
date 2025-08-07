FROM eclipse-mosquitto:2

COPY mosquitto.conf /mosquitto/config/mosquitto.conf

# Ensure config files are owned by mosquitto user
RUN chown -R mosquitto:mosquitto /mosquitto/config \
    && chmod -R 0600 /mosquitto/config

EXPOSE 1883 9001