# LogProxy

LogProxy is a tool to analyze console logs of standard IO.

## Usage

```sh
go build -o logproxy .
cd ./web
npm i
npm run build
```

```sh
./logproxy
```

## Development

```sh
cd ./web
npm i
npm run start
```

```sh
LOGPROXY_FRONTEND="http://localhost:3000" go run .
```
