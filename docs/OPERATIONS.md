# Operations

This is a deployment recipe, not evidence that a server, domain, OAuth client, schedule, or off-server backup has been provisioned. Feature completion is tracked separately in docs/tasks/README.md.

## Runtime

Run one Node 24 LTS application process on one Linux host. SQLite and its WAL/shared-memory sidecars must reside together on persistent local disk, outside static assets. Do not place WAL-mode SQLite on a network filesystem or attach the same file to multiple application hosts.

Use a dedicated unprivileged service account, private database/backup directories, and an HTTPS reverse proxy (for example Caddy). Keep secrets out of source control and readable only by the service account. Allowlist changes require a service restart so the new environment is loaded.

After installation, configure environment, apply migrations, run checks/build, and start the service. Set the Google redirect URI to the exact public HTTPS origin plus `/api/auth/callback/google`. Verify a permitted Google account, a non-allowlisted account, sign-out, and access after allowlist removal before relying on the deployment.

Example systemd unit, after replacing paths and service account:

```ini
[Unit]
Description=Tally
After=network.target

[Service]
Type=simple
User=tally
WorkingDirectory=/srv/tally
Environment=NODE_ENV=production
EnvironmentFile=/etc/tally/tally.env
ExecStart=/usr/bin/node /srv/tally/node_modules/srvx/bin/srvx.mjs --prod --host 127.0.0.1 --port 3000 --static /srv/tally/dist/client --entry /srv/tally/dist/server/server.js
Restart=on-failure
UMask=0077
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

The environment file's `TALLY_DATABASE_PATH` should be an absolute path such as `/var/lib/tally/tally.sqlite`, writable by `tally`. The application deployment and database directories have different lifecycles: redeploying source must not replace the database directory. `/health` is a liveness endpoint, not proof that Google sign-in or all database operations are ready.

Example Caddy configuration (replace the domain):

```caddyfile
tally.example.com {
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Real-IP {remote_host}
    }
}
```

Keep the application port on loopback. Caddy overwrites `X-Real-IP` with the connecting address; Better Auth uses that header for rate limiting. Do not expose the Node port directly or trust a client-supplied forwarding header. Verify the proxy path and client-IP behavior on the actual server. TanStack Start's CSRF middleware protects server-function requests; Better Auth protects its own OAuth routes.

## Backups

`pnpm db:backup /PRIVATE_DESTINATION/tally-DATE.sqlite` uses the driver's online backup API, includes committed WAL data, and writes a mode-0600 destination. Do not copy only the live main `.sqlite` file.

Schedule that command daily with a systemd timer or the operator's existing scheduler, retaining seven daily successful backups. Copy successful backups to an access-controlled off-server destination; this location is an operator input, not an external dependency built into Tally. Protect them as carefully as the live database because they contain authentication/session and member data. Backups on the same disk do not protect against losing that disk.

Before migrations, take an additional consistent backup and retain the corresponding application version. Review generated SQL; do not use schema push against production.

## Restore

1. Stop the application service and confirm no other process has the database open.
2. Preserve the current database and any `-wal`/`-shm` sidecars together in a recovery directory; do not overwrite or discard them prematurely.
3. Check the backup with SQLite `PRAGMA integrity_check` and confirm it matches the application/migration version being restored.
4. Install the backup at the configured database path with the service account as owner and mode 0600. Do not leave stale sidecars from the old database at the restored path.
5. Restore the matching application version, start the service, and verify expected records and member access. Run a restore rehearsal on disposable data before production use.

Local automated tests exercise online backup, opening the backup, integrity checking, and persistence across database reopen. Actual systemd/proxy/off-server transfer and a real production restore are not yet verified.
