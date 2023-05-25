# Bettles Scanner

The Scanner is a NestJS application that recurrently crawls the sports data provider API (SportMonks) and integrates this data into our system. 

The scanner includes a development mode which does not make real request to the (rate-limited) API. Therefore, it includes league, season and teams data in form of JSON files. See [here](./mock-db/README.md) for information and a list of those. The final Docker image will include this data as well. Just set the `MOCK_API` variable to `true` to enable this feature. This is the default when running in `DEVELOPMENT`.

## Settings

There are several system environment variables to set up the Scanner to change its behaviour. They are divided into three areas. See below.

### Common

- `NODE_ENV`: # Todo: development / production
- `PORT`: The port on which the server is running. Defaults to `3000`
- `LOG_LEVEL`: The log level. Values in the array can be any combination of `log`, `error`, `warn`, `debug`, and `verbose`. Defaults to `log`

### Crawling

- `API_TOKEN`: The token to get access to the Sportmonks API
- `API_BASE_URL`: The base URL of the Sportmonks API
- `MOCK_API`: Whether to load mock data (`true`) or request real data from API (`false`)
- `SEASON_MODE`: choose between `manual` and `auto`
  - `manual`: Use IDs provided by `SEASONS` variable
  - `auto`: Crawl all currently active and unlocked (available in our subscription) seasons from API (`MOCK_API=false`) or scan file system for available seasons (`MOCK_API=true`)
- `SEASONS`: A list of season IDs used for crawling (mock and real) when `SEASON_MODE=manual`
- `TIMEOUT`: Time elapsed in milliseconds when to re-run a data refresh (when `CRAWL_MODE=until-stopped`)
- `CRAWL_MODE`: Whether to run a single fetch (`once`) or in loop (`until-stopped`)
- `AUTORUN`: Indicates to directly start crawling on start up. Defaults to `true`;
- `PATH_TO_MOCK_FILES`: Path to JSON files containing the sports data (read/write). Defaults to `./mock-db`
- `PERSIST_AS_JSON`: Indicates to save fetched data to file system. Defaults to `false`
- `PERSIST_TO_DB`: Indicates to update corresponding database tables. Defaults to `true`
- `PERSIST_SQL`: Indicates to save generated SQL to file system. Defaults to `false`

### Database

If you want to persist the retrieved data to a database (`PERSIST_TO_DB`), which should be the normal case, you need to specify the following values:

- `PGHOST`: The host on which the cluste is running. Defaults to `localhost`
- `PGDATABASE`: The database. Defauts to `postgres`
- `PGUSER`: The database user. Defaults to `postgres`
- `PGPASSWORD` The password. Defaults to `postgres`
- `PGPORT`: The port on which the cluster is running. Defaults to `5432`
- `MAXPOOLSIZE`: The maximum number of clients the pool should contain. Defaults to `1`

There can be cases where it makes sense to set `PERSIST_TO_DB` to `false`. For example if you want to provide new or updated data to the Docker image. In this case you do not need to specify a database connection. Instead, you could only set the `PERSIST_AS_JSON` variable to `true`. Keep in mind that you also need an API token in this case.

## Development

### Installation

```bash
$ npm install
```

### Useful containers

Checkout the docker-compose.yml from the `Bettles DB` project. Start the containers with:

```
docker-compose run -d
```

### Environment Variables

The system needs some properties, which are set by environment variables. See section "Settings" above.

You can copy the `.env-template` file to `.env` (which is out of version control) and set up your own properties.

### Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## Create json file(s)

To create a json file for a specific season you have to run the application in prod mode and make a http request like this one:

```
localhost:3000/db-mock/season/15733
```

Where 15733 is the season id you want to receive from Sportmonks.
This process is still work in progress!!

## Bettles DevTools

This web page can be used to manipulate the local storage of season data. Implemented features are:

### Set back season to a date

It is possible to set back a season to a specific date. This is only working in `dev` mode.
How to:

- add a season or seasons to the `.env` file
- run the app
- open your browser with `http://localhost:3000/db-mock/`
- navigate to tab `Set Back Season`
- choose a season and a date to set back the season

The data will not be stored in the .json files. It is only temporarily but gets pushed via SQL to the database.

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
