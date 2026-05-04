# Security Overview

## Security Posture

This project applies Koydo security standards across all components. The baseline requirements are:

1. **SSL/TLS verification on every external request** — no `verify=False`
2. **Rate limiting** on all external API calls
3. **Log sanitization** — no API keys, PII, or credentials in logs
4. **Parameterised queries** — no string formatting into SQL
5. **Input validation** at all system boundaries
6. **Dependency pinning** — all packages pinned with hashes in `koydo-requirements.txt`
7. **Secrets in environment variables** — never hardcoded or committed

## Authentication & Authorization

### API Gateway
- All routes require a valid JWT (RS256) except `/health` and `/metrics`
- JWT issued by the Auth Service, verified in middleware
- Token expiry: 1 hour for access tokens, 30 days for refresh tokens
- Per-user rate limit: 1000 requests/minute (sliding window in Redis)

### Admin Routes
- Admin routes require `role: admin` claim in JWT
- MFA required for admin account creation

### WebSocket
- Connection requires valid JWT in auth handshake
- Socket.io auth: `{ auth: { token: "<jwt>" } }`

## Network Security

| Layer | Control |
|-------|---------|
| Ingress | Kubernetes Ingress with TLS termination (Let's Encrypt) |
| Service mesh | mTLS between internal services (Istio or Linkerd) |
| External calls | certifi CA bundle, timeout 10s, max response 10MB |
| Rate limiting | Per-IP and per-user limits at API gateway |

## Dependency Security

```bash
# Run before every release
bandit -r tradingagents/ -ll
safety check -r koydo-requirements.txt
semgrep --config=auto tradingagents/
trivy image tradingagents:latest
```

All four scans must pass with zero HIGH/CRITICAL findings before deployment.

## Secrets Management

```
Environment variable  →  Kubernetes Secret  →  Pod env var
```

- Kubernetes Secrets encrypted at rest (AES-256)
- No secrets in Docker images or build artifacts
- Secret rotation: monthly automated rotation via external-secrets-operator
- Audit log for all secret access

## Data Classification

| Data Type | Sensitivity | Storage | Encryption |
|-----------|------------|---------|-----------|
| API keys | Critical | K8s Secrets | Encrypted at rest |
| JWT tokens | High | Redis (TTL) | In-transit TLS |
| User PII | High | PostgreSQL | Column-level AES |
| Market data | Low | TimescaleDB | At-rest disk encryption |
| Agent decisions | Low | PostgreSQL | At-rest disk encryption |

## Audit Logging

All significant events are logged with:
- `event_type`
- `user_id` (if authenticated)
- `ip_address` (sanitized — last octet zeroed for privacy)
- `timestamp` (UTC)
- `outcome` (success / failure)
- `metadata` (sanitized — no raw API keys or passwords)

Events logged: authentication, trade submission, risk limit breach, admin action, secret access.

## Incident Response

1. **Detection:** Prometheus alert or Sentry error spike
2. **Triage:** Check Grafana dashboard, Sentry events, audit log
3. **Containment:** Rotate affected secrets, revoke JWTs, scale down affected service
4. **Eradication:** Deploy patched image, apply migration if schema involved
5. **Recovery:** Monitor for 24h, re-enable affected features
6. **Post-mortem:** Written within 5 days, root cause + remediation documented

## Security Contacts

| Role | Contact |
|------|---------|
| Security owner | robert@waltos.net |
| Infrastructure | K8s cluster admin |
| Dependency alerts | GitHub Dependabot + Safety CI |
