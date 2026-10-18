# build stage
FROM node:lts-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN cd dist/static-files/appliance/installation && sha256sum install-appliance.sh > install-appliance.sh.sha256

# production stage
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/*
COPY enabled.cloud-ui.conf /etc/nginx/conf.d/enabled.cloud-ui.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
