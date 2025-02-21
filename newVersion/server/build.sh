#!/bin/bash
docker-compose -f docker-compose.vending.yml  down
docker-compose -f docker-compose.vending.yml up -d
