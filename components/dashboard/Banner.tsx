'use client';

import Image from 'next/image';

export default function BannerComponent() {
    return (
        <div className="flex items-center justify-center mt-6 sm:mt-2 px-4 sm:px-8 mb-2 sm:mb-4">
            <Image
                src='/images/backgrounds/muawin_banner.jpg'
                alt="Muawin Banner"
                width={2400}
                height={400}
                className="w-full max-w-[1400px] h-auto shadow-lg rounded-[10px]"
                priority
            />
        </div>
    );
}
