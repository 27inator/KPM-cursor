# ====================================
# KMP SUPPLY CHAIN - KASPA BROADCASTER
# Multi-stage Rust build for production
# ====================================

FROM rust:1.75-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    musl-dev \
    openssl-dev \
    openssl-libs-static \
    pkgconfig \
    git

# Set working directory
WORKDIR /app

# Copy source files
COPY Cargo.toml Cargo.lock ./
COPY src ./src

# Build with optimizations
ENV RUSTFLAGS="-C target-feature=+crt-static"
RUN cargo build --release --target x86_64-unknown-linux-musl

# ====================================
# RUNTIME STAGE - Minimal Alpine
# ====================================
FROM alpine:latest AS runtime

# Install runtime dependencies
RUN apk add --no-cache ca-certificates

# Create non-root user
RUN addgroup -g 1001 -S kaspa && adduser -S broadcaster -u 1001 -G kaspa

# Set working directory
WORKDIR /app

# Copy the built binary
COPY --from=builder --chown=broadcaster:kaspa /app/target/x86_64-unknown-linux-musl/release/kaspa_broadcaster ./kaspa_broadcaster

# Make executable
RUN chmod +x ./kaspa_broadcaster

# Switch to non-root user
USER broadcaster

# Environment variables
ENV RUST_LOG=info
ENV KASPA_NODE="127.0.0.1:16110"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ./kaspa_broadcaster --help || exit 1

# Default command
ENTRYPOINT ["./kaspa_broadcaster"]
CMD ["--help"] 