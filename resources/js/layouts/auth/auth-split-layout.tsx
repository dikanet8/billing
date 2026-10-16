import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0 overflow-hidden bg-background">
            {/* Left side: Beautiful image and overlay */}
            <div className="relative hidden h-full flex-col lg:flex overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/images/login-bg.png" 
                        alt="Background" 
                        className="h-full w-full object-cover transition-transform duration-[20s] ease-linear hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-indigo-900/10 mix-blend-overlay" />
                </div>
                
                {/* Branding overlay */}
                <div className="relative z-20 flex p-10 flex-col h-full justify-between">
                    <Link
                        href={home()}
                        className="flex items-center text-xl font-bold tracking-tight text-white drop-shadow-md hover:opacity-90 transition-opacity"
                    >
                        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-lg border border-white/30">
                            <AppLogoIcon className="h-6 w-6 fill-current text-white" />
                        </div>
                        {name}
                    </Link>
                    
                    <div className="mt-auto max-w-md space-y-4 pb-8">
                        <h2 className="text-4xl font-bold text-white tracking-tight drop-shadow-xl leading-tight">
                            Akses Cepat, <br/> Pengelolaan Mudah.
                        </h2>
                        <p className="text-lg text-white/80 font-medium drop-shadow-md">
                            Sistem billing internet modern dengan pengalaman manajemen yang mulus.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Right side: Login Form */}
            <div className="w-full lg:p-8 flex items-center justify-center relative">
                {/* Subtle animated gradient background for the form side (visible mostly on mobile or behind the form) */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-zinc-900 dark:to-slate-900" />
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
                
                <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px] bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 transition-all hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-xl border border-white/20">
                            <AppLogoIcon className="h-8 w-8 fill-current text-white" />
                        </div>
                    </Link>
                    
                    <div className="flex flex-col items-center text-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {title}
                        </h1>
                        <p className="text-sm text-balance text-muted-foreground font-medium">
                            {description}
                        </p>
                    </div>
                    
                    <div className="w-full relative z-20 [&_button]:bg-blue-600 hover:[&_button]:bg-blue-700 [&_button]:hover:opacity-90 [&_button]:shadow-lg [&_button]:shadow-blue-500/30 [&_button]:transition-all [&_input]:border-slate-200 dark:[&_input]:border-zinc-800 [&_input]:bg-white/50 dark:[&_input]:bg-zinc-900/50 [&_input]:transition-all focus:[&_input]:bg-white dark:focus:[&_input]:bg-zinc-900 [&_button]:text-white">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
