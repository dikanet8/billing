import { Head } from '@inertiajs/react';
import { Send } from 'lucide-react';

export default function Pesan() {
    return (
        <>
            <Head title="Pesan Masal" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Pesan Masal & Notifikasi</h1>
                </div>
                <div className="bg-white dark:bg-neutral-900 border border-sidebar-border/70 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center text-neutral-500 h-64">
                    <Send className="w-12 h-12 mb-4 text-neutral-300 dark:text-neutral-600" />
                    <p>Halaman Kirim Pesan Masal via WhatsApp/Email (Dalam Pengembangan)</p>
                </div>
            </div>
        </>
    );
}

Pesan.layout = {
    breadcrumbs: [
        {
            title: 'Pesan Masal',
            href: '/pesan',
        },
    ],
};
