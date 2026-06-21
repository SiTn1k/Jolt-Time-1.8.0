# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.8.x  | ✅ Currently supported |
| < 1.8  | ❌ End of life         |

## Reporting a Vulnerability

If you discover a security vulnerability within Jolt Time, please follow these steps:

1. **DO NOT** create a public GitHub issue
2. Email the maintainer directly: [security contact]
3. Include the following information:
   - Type of vulnerability
   - Full paths of source file(s) related to the vulnerability
   - Location of the affected source code (tag/branch/commit)
   - Step-by-step instructions to reproduce
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue

We will respond within 48 hours and work with you to understand and address the issue.

## Security Measures

### Server-side Validation
- All edge functions validate Telegram initData using HMAC-SHA256
- Zod schemas for all API inputs
- Server-authoritative game state (energy, XP)

### Database Security
- Row Level Security (RLS) enabled on all tables
- Service role keys never exposed to client
- Parameterized queries to prevent SQL injection

### Client Security
- TypeScript strict mode enabled
- No sensitive data in client-side code
- CSP headers configured
- Input sanitization on all user inputs

## Known Security Considerations

### Telegram Mini App Security
- initData validation is performed server-side
- User authentication via Telegram's built-in auth
- Rate limiting on sensitive operations

### Anti-Cheat Measures
- Server timestamp for offline calculations
- Server-authoritative energy management
- HMAC validation for chest opening
- Rate limiting on API endpoints

## Security Tools

### CI/CD Security
- npm audit runs on every PR
- Snyk vulnerability scanning
- Dependency updates via Dependabot
- Secret scanning in GitHub Actions

### Running Security Checks

```bash
# Run all security checks locally
npm run security-check

# Run npm audit
npm audit

# Run TypeScript type check (catches many issues)
npm run typecheck

# Build (validates all code compiles)
npm run build
```

## Security Updates

Security updates are released as patch versions (1.8.1, 1.8.2, etc.) and announced via:
- GitHub Security Advisories
- Release notes on GitHub Releases

## License

By contributing to Jolt Time, you agree that your contributions will be licensed under the same license as the project.
