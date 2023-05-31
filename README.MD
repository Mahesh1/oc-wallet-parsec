# openCBDC client-cli web proxy

a web proxy wrapper for the openCBDC client-cli

## Installation

docker-compose is required to run this project

1. Clone the repo
2. rename example.env to .env and update the values
3. Start the OpenCBDC Network
   ```bash
   docker-compose --file docker-compose-2pc.yml --file docker-compose-prebuilt-2pc.yml  up --no-build
   ```
4. Start the webproxy
   ```bash
   docker-compose --file docker-compose-Walletproxy.yml   up --build
   ```

## Usage

```bash
 htttp://localhost:3000/api-docs
```
