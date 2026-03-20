# Etapa 1: Construcción (Build)
FROM node:18-alpine AS build

WORKDIR /app

# Copiamos los archivos de dependencias de Node
COPY package*.json ./
RUN npm install

# Copiamos el resto del código y generamos los archivos de producción
COPY . .
RUN npm run build

# Etapa 2: Servidor Web (Nginx)
# Usamos Nginx para servir los archivos estáticos de React
FROM nginx:stable-alpine

# Copiamos los archivos del 'dist' (o 'build') a la carpeta de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
