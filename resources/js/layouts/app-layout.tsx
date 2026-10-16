import { usePage, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

function TenantPaymentListener({ tenantId }: { tenantId: string }) {
    useEffect(() => {
        console.log("[DEBUG] TenantPaymentListener mounted. Listening to PrivateChannel: Tenant." + tenantId);
    }, [tenantId]);

    useEcho('Tenant.' + tenantId, '.PembayaranBerhasil', (e: any) => {
        console.log("[DEBUG] PembayaranBerhasil RECEIVED!", e);
        const title = `Pembayaran Rp ${e.nominal} Berhasil`;
        const body = `Dari ${e.nama} (Bln ${e.bulan}) via ${e.metode} oleh ${e.admin}.`;
        
        // Munculkan in-app toast notification (OS-level notification ditangani oleh Web Push Service Worker)
        toast.success(title, { description: body });

        // Update data halaman secara otomatis
        router.reload();
    }, [tenantId], 'private');
    
    return null;
}

function RealtimeListeners() {
    const { auth } = usePage().props;
    const role = (auth?.user as any)?.role;
    const isOwner = ['OWNER', 'SUPERADMIN'].includes(role);
    const tenantId = (auth?.user as any)?.tenant_id;
    
    useEffect(() => {
        console.log(`[DEBUG] RealtimeListeners evaluated. Role: ${role}, isOwner: ${isOwner}, tenantId: ${tenantId}`);
    }, [role, isOwner, tenantId]);
    
    if (isOwner && tenantId) {
        return <TenantPaymentListener tenantId={tenantId} />;
    }
    
    return null;
}


export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                router.reload();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <RealtimeListeners />
            {children}
        </AppLayoutTemplate>
    );
}
