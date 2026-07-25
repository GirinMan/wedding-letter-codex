FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html healthz /usr/share/nginx/html/
COPY data /usr/share/nginx/html/data
COPY design-systems /usr/share/nginx/html/design-systems
COPY media /usr/share/nginx/html/media
COPY scripts /usr/share/nginx/html/scripts
COPY styles /usr/share/nginx/html/styles

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
