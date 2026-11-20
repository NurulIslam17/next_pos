<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="My POS inventory dashboard and product management.">
        <meta name="theme-color" content="#4f46e5">
        <title>Prantik Inventory</title>
        <link rel="icon" type="image/svg+xml" href="{{ asset('favicon.svg') }}">
        <link rel="shortcut icon" href="{{ asset('favicon.ico') }}">
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body class="bg-slate-50 font-sans text-slate-900 antialiased">
        <div id="root"></div>
    </body>
</html>
