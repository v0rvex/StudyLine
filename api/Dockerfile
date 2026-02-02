FROM rustlang/rust:nightly-slim AS builder

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN cargo build --release

FROM debian:stable-slim

WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/api /app/api

ENV PORT=1200
EXPOSE 1200

CMD ["./api"]


