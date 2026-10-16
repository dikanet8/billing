import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img {...props} src="/logo.jpg" alt="Logo Jaringan Rakyat" className={`${props.className || ''} object-contain rounded`} />
    );
}
