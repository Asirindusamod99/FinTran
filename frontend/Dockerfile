FROM nginx:alpine
WORKDIR /usr/share/nginx/html
# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf
# Copy all frontend files
COPY . .
# Move our custom config to the right place
RUN cp nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
