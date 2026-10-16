import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center p-4 md:p-8 bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
            {/* Removed Ambient Background Blobs */}

            <div className="w-full max-w-[420px] relative z-10">
                <div className="flex flex-col rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 p-8 shadow-2xl shadow-blue-900/5 dark:shadow-black/40">
                    <div className="mb-4 flex flex-col items-center gap-1 text-center">
                        <Link href={home()} className="flex flex-row items-center justify-center gap-3 mb-1 group w-full">
                            <div className="bg-white dark:bg-neutral-900 rounded-lg group-hover:scale-105 transition-transform duration-300 shrink-0">
                                <AppLogoIcon className="h-8 w-8" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white leading-tight">
                                    Jaringan Rakyat <span className="text-blue-600 dark:text-blue-400">Billing</span>
                                </span>
                            </div>
                        </Link>
                        
                        <div className="w-full h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
