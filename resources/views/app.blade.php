<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#171717" media="(prefers-color-scheme: dark)">
        <link rel="apple-touch-icon" href="/logo.jpg">

        {{-- Error Catcher --}}
        <script>
            window.onerror = function(msg, url, line, col, error) {
                document.body.innerHTML += '<div style="color:red;z-index:9999;position:fixed;top:0;left:0;background:white;padding:20px;border:2px solid red;">' + msg + '<br><pre>' + (error && error.stack) + '</pre></div>';
            };
            window.onunhandledrejection = function(e) {
                document.body.innerHTML += '<div style="color:red;z-index:9999;position:fixed;top:0;left:0;background:white;padding:20px;border:2px solid red;">Unhandled Promise: ' + e.reason + '</div>';
            };
        </script>
        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/logo.jpg" type="image/jpeg" sizes="any">
        <link rel="apple-touch-icon" href="/logo.jpg">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
