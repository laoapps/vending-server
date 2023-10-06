#!/bin/bash
docker-compose down
docker-compose -f docker-compose.vending.yml up -d
