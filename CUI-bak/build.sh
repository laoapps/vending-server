#!/bin/bash
ionic build --prod
# docker-compose --build
docker-compose down
docker-compose up -d