#!/bin/sh
set -e

cd /var/www/html

# Generate key if not set
if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force
fi

# Cache config & routes for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force

# Create storage link
php artisan storage:link 2>/dev/null || true

# Start supervisor (nginx + php-fpm)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
