# Cloud UI

This UI is the frontend for `cloud-user-registry`: account registration and
login, switching between the Groups a user belongs to, managing the
currently active Group's members, and handling invitations.

## Development

A few things are required to make development easy.

1. NPM/Vite development packages
2. Access to `cloud-user-registry` (remote or locally)
3. Nginx proxying the UI and service under the same origin

### Run development server

> npm run dev

This opens up a development server, likely on http://localhost:5173/

### `cloud-user-registry` API

Currently hosted in Kubernetes at `cloud.humi.kaese.space` under the
`/cloud-user-registry` path prefix (see `huemie-gitops-base/cloud`).

### Nginx proxying

I am currently proxying with an nginx config like so

```
worker_processes  1;
events {
    worker_connections  1024;
}
http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    server {
        listen       80;
        server_name  localhost;
        location / {
            proxy_pass http://localhost:5173;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
        location /cloud-user-registry {
            proxy_pass http://cloud.humi.kaese.space;
        }
    }
}
```

This means that if the API is available at cloud.humi.kaese.space and the
development server is opened at localhost:5173, the UI behaves pretty much
like it will be once built and deployed, except that it has the Vite
debugging stuff injected.

## Architecture

Same shape as [huemie-ui](../huemie-ui): Vue 3 + Vite SPA, `vue-router` for
routing, `axios` for API calls, built and served from an nginx container
(see `Dockerfile`). Auth follows the same use-token/refresh-token cookie
pattern (`src/composables/useAuth.js`) - the one difference is that
`cloud-user-registry`'s use token also carries a `groupId`, so `useAuth`
additionally exposes `currentGroupId` and a `selectGroup(groupId)` action
for switching which Group is active (see `src/Groups.vue`).
