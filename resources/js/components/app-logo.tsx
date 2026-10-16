import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden bg-white">
                <AppLogoIcon className="w-full h-full object-cover" />
            </div>
        </>
    );
}
