import { Head } from '@inertiajs/react';
import { Wifi } from 'lucide-react';

export default function Voucher() {
    return (
        <>
            <Head title="Hotspot & PPPoE" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Hotspot Voucher & PPPoE</h1>
                </div>
                <div className="bg-white dark:bg-neutral-900 border border-sidebar-border/70 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center text-neutral-500 h-64">
                    <Wifi className="w-12 h-12 mb-4 text-neutral-300 dark:text-neutral-600" />
                    <p>Halaman Manajemen Voucher Hotspot dan Akun PPPoE (Dalam Pengembangan)</p>
                </div>
            </div>
        </>
    );
}

Voucher.layout = {
    breadcrumbs: [
        {
            title: 'Voucher',
            href: '/voucher',
        },
    ],
};
