# Audiobin

Visualize Bandwidth Programmable Voice media streaming calls.

## Requirements

- Node 16+
- Yarn 3+

## Usage

Use [`<StartStream>`](https://dev.bandwidth.com/docs/voice/bxml/startStream) in your Bandwidth BXML and point `destination` to `ws://{host}/audio`, where `{host}` is where this application is running. When streams are started, they will show up in the UI.

This application also serves BXML at `http://{host}/bxml/{file}`, responding with the file at server/bxml/{file}.xml. It uses [Handlebars](https://handlebarsjs.com/) templating, so environment variables can be accessed with `{{ env.MY_VAR }}`.

## Run

```shell
# Prepare the server environment variables
# Create and fill values in .env
cp server/.env.template server/.env

# Install dependencies
yarn install

# Build
yarn build

# Start server which will also serve the client
yarn start:server

# Access it in the browser, use the port shown in the logs
```

## Development

The client has hot-reloading, so it might be useful to run the client standalone for development.

If your server is not running locally, set the `REACT_APP_SERVER_HOST` environment variable so the client can connect to it.

```shell
# Run server and client with watches
# Changes to client files will reload automatically
yarn start:client
yarn start:server
```