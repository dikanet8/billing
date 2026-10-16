import { Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';

import { edit } from '@/routes/security';
import { Card } from '@/components/ui/card';

type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

export default function Security(props: Props) {

    return (
        <>
            <Head title="Keamanan Akun" />

            <div className="space-y-6 max-w-2xl mx-auto pb-10">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Keamanan Akun</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Gunakan kata sandi yang panjang dan acak untuk menjaga keamanan akun Anda.</p>
                </div>

                <div className="space-y-6 pt-6">
                    <ManageTwoFactor
                        canManageTwoFactor={props.canManageTwoFactor}
                        requiresConfirmation={props.requiresConfirmation}
                        twoFactorEnabled={props.twoFactorEnabled}
                    />

                    <ManagePasskeys
                        canManagePasskeys={props.canManagePasskeys}
                        passkeys={props.passkeys}
                    />
                </div>
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Keamanan Akun',
            href: edit(),
        },
    ],
};
