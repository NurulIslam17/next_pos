FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --prefer-dist --ignore-platform-reqs

FROM php:8.3-fpm-alpine
RUN apk add --no-cache postgresql-dev libzip-dev icu-dev oniguruma-dev \
    && docker-php-ext-install pdo_pgsql pgsql zip intl bcmath opcache pcntl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/php/php.ini /usr/local/etc/php/conf.d/app.ini

WORKDIR /var/www/html
COPY --from=vendor /app/vendor ./vendor
COPY . .
RUN composer dump-autoload --optimize --no-scripts \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]
