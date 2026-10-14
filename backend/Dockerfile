FROM php:8.3-fpm-alpine

# Install system deps + PHP extensions Laravel needs
RUN apk add --no-cache \
  nginx supervisor curl zip unzip git \
  libpng-dev libjpeg-turbo-dev freetype-dev \
  oniguruma-dev libxml2-dev icu-dev \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install \
  pdo_mysql mbstring exif pcntl bcmath gd intl xml

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer files first (cache layer)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist


# Copy full app
COPY . .

# Finish composer
RUN composer dump-autoload --optimize \
  && composer run-script post-autoload-dump 2>/dev/null || true

# Create storage dirs Laravel expects
RUN mkdir -p storage/framework/{sessions,views,cache} \
  && mkdir -p storage/logs bootstrap/cache \
  && chown -R www-data:www-data storage bootstrap/cache \
  && chmod -R 775 storage bootstrap/cache

# ── Nginx config ──
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# ── Supervisor (runs nginx + php-fpm together) ──
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ── Entrypoint: run migrations then start ──
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]