# Audiobin

Visualize Bandwidth Programmable Voice media streaming calls.

## Requirements

- Node 16+
- Yarn 3+

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

## Local

```shell
# Set server host for client web socket
# Since create-react-app is static, can't use the server's environment variables
export REACT_APP_SERVER_HOST=<host where this is running>:<port>

# Run server and client with watches
# Changes to files will reload automatically
yarn start:client
yarn start:server
```