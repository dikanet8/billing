import { usePage } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const page = usePage<any>();
    const { auth } = page.props;
    const getInitials = useInitials();

    return (
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur flex h-14 md:h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-4 md:px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="ml-auto flex items-center space-x-2">
                {auth.user?.role === 'SUPERADMIN' && (
                    <div className="mr-1 md:mr-4 flex items-center space-x-1 md:space-x-2">
                        <span className="text-sm text-gray-500 hidden md:inline-block">Tenant:</span>
                        <select
                            className="text-xs md:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 px-2 py-1 md:px-3 md:py-1.5 w-[100px] sm:w-[130px] md:w-auto truncate"
                            value={auth.active_tenant_id || ''}
                            onChange={(e) => {
                                const form = document.createElement('form');
                                form.method = 'POST';
                                form.action = '/switch-tenant';
                                
                                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                                if (csrfToken) {
                                    const csrfInput = document.createElement('input');
                                    csrfInput.type = 'hidden';
                                    csrfInput.name = '_token';
                                    csrfInput.value = csrfToken;
                                    form.appendChild(csrfInput);
                                }
                                
                                const tenantInput = document.createElement('input');
                                tenantInput.type = 'hidden';
                                tenantInput.name = 'tenant_id';
                                tenantInput.value = e.target.value;
                                form.appendChild(tenantInput);
                                
                                document.body.appendChild(form);
                                form.submit();
                            }}
                        >
                            <option value="">-- Semua Tenant (Global) --</option>
                            {auth.tenants?.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.nama}</option>
                            ))}
                        </select>
                    </div>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="size-10 rounded-full p-1"
                        >
                            <Avatar className="size-8 overflow-hidden rounded-full">
                                <AvatarImage
                                    src={auth.user?.avatar}
                                    alt={auth.user?.name}
                                />
                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(auth.user?.name ?? '')}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        {auth.user && (
                            <UserMenuContent user={auth.user} />
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
