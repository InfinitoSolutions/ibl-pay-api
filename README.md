# C2C - API

## Prerequisites
- Node JS 8.11.3 or newer
- Docker 
- Docker compose

## Installation
```
# 1. Copy .env.example to .env and change it if needed

- MONGO_URL: MongoDB connection string (ex: mongodb://localhost/c2c)
- MONGO_TEST_URL: MongoDB connection string for unit test (ex: mongodb://localhost/c2ctest)
- AGENDA_MONGO_URL: MongoDB connection string for storing Agenda Jobs (ex. localhost/c2cagenda)
- REDIS_URI: Redis URL (Socket IO Adapter)
- NEO_SCAN_URL: NEO Scan URL (ex: http://neo-scan/api/main_net)
- NEO_RPC_URL: NEO RPC Node (ex: http://neo-privnet:30333)
- SENDGRID_API_KEY: SEND GRID Mailer Service
- EMAIL_FROM: Sender's email address (ex: no-reply@blockchainlabs.asia)

# 2. Build containers
$ docker-compose build

# 3. Start containers
$ docker-compose up

# 4. Stop containers
$ docker-compose down
```

## Local ENV
On local development machine, dev.yml should be used instead of `docker-compose.yml`. Here are equivalent commands:

```
$ docker-compose -f dev.yml build
$ docker-compose -f dev.yml up
$ docker-compose -f dev.yml down
```

## Unit Test
```
$ docker exec -ti c2c-api /bin/sh -c "npm test"

- Unit test for test env
$ docker exec -ti c2c-api /bin/sh -c "NODE_ENV=test npm test"
```

## URLs
- API: http://localhost:4000
- Rockmongo: 
    + URL: http://localhost:8080
    + User/pass: admin/admin

## Troubleshooting
This compose has an external link to Network  of NEO Scan Docker, you may get an error of missing network `neo-scan-docker_default`. If you do not have it, simply create a a network of the same name.

```
$ docker network create neo-scan-docker_default
```

## Local Development (Windows)
Install MongoDB (Default port: 27017)
    Create 3 DBs: c2c, c2ctest, c2cagenda
Install/Run Redis server (Default port: 6379)
    Windows: https://github.com/dmajkic/redis/downloads
    **NEW: https://github.com/MicrosoftArchive/redis/releases

*Goto root folder, run CMD with below commands:
npm install
"./node_modules/.bin/gulp" build
yarn start
*Test link:
http://localhost:4000
