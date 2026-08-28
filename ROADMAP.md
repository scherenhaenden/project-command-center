# Product roadmap

## Architecture

- Local-first Angular PWA using IndexedDB for offline web and mobile use.
- Optional NestJS and PostgreSQL server for on-demand cross-device sync.
- Import/export of versioned data files for a sync folder compatible with Google Drive, Dropbox, iCloud Drive, Syncthing, and similar services.
- Provider-specific sync adapters, beginning with a user-authorized Google Drive adapter.
- Conflict detection and resolution; no silent overwrites.

## Command-line interface

Provide a separate CLI package with commands to:

- Create, list, update, archive, and search projects and work items.
- Import and export portable data files.
- Run an explicit sync and inspect sync conflicts.
- Start or configure the optional local/server API.

The CLI will use the same domain models and repository contracts as the web application.

## Delivery rules

- Personal profile data, credentials, and real workspace data remain local and ignored by Git.
- The public repository contains only neutral demo data and safe configuration examples.
