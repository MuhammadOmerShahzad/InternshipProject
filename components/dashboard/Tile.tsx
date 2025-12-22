'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface TileProps {
    name: string;
    image: string;
    onClick?: (name: string) => void;
}

export default function TileComponent({ name, image, onClick }: TileProps) {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        setHasLoaded(true);
    }, []);

    const handleClick = () => {
        if (onClick) {
            onClick(name);
            return;
        }

        // Default navigation paths
        const paths: Record<string, string> = {
            'Licenses': '/licenses',
            'Approvals': '/approvals',
            'Vehicles': '/vehicles',
            'Health Safety Environment': '/hse',
            'Taxation': '/taxation',
            'Certificates': '/certificates',
            'Security': '/security',
            'Admin Policies and SOPs': '/admin-policies',
            'Rental Agreements': '/rental-agreements',
            'User Management': '/user-management',
        };

        const path = paths[name];
        if (path) {
            router.push(path);
        }
    };

    return (
        <div
            className={`
        relative flex items-center justify-start h-[70px] sm:h-[80px] md:h-[90px]
        p-1 cursor-pointer rounded-2xl overflow-hidden
        transition-all duration-[400ms] cubic-bezier-[0.4,0,0.2,1]
        ${hasLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}
        ${isHovered
                    ? 'bg-gradient-to-br from-[#ff8c42] to-[#ffb366] shadow-[0_8px_25px_rgba(255,140,66,0.4),0_0_0_3px_rgba(255,140,66,0.1)] -translate-y-1 scale-[1.02]'
                    : 'bg-white dark:bg-[#333] shadow-[0_4px_15px_rgba(0,0,0,0.2)]'
                }
        ${isHovered ? 'animate-pulse-custom' : ''}
        before:content-[''] before:absolute before:top-0 before:left-[-100%] 
        before:w-full before:h-full before:bg-gradient-to-r before:from-transparent 
        before:via-white/20 before:to-transparent before:transition-[left] before:duration-500
        hover:before:left-[100%]
        active:translate-y-[-2px] active:scale-[0.98]
      `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
            aria-label={`Navigate to ${name}`}
        >
            <div className="flex items-center pl-1 sm:pl-2 z-10 relative">
                <Image
                    src={image}
                    alt={name}
                    width={45}
                    height={45}
                    className={`mr-[15px] transition-all duration-[400ms] ${isHovered ? 'brightness-[1.2] contrast-[1.1]' : ''
                        }`}
                />
                <span
                    className={`
            text-sm sm:text-base font-bold
            transition-all duration-[400ms]
            ${isHovered
                            ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                            : 'text-black dark:text-white'
                        }
          `}
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    {name}
                </span>
            </div>
        </div>
    );
}
