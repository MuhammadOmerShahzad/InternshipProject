'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/context/UserContext';
import FilePageTemplate from '@/components/modules/FilePageTemplate';
import { getModuleBySlug } from '@/lib/config/moduleConfig';

export default function RentalAgreementsPage() {
    const { user } = useUser();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-[#f15a22] border-t-transparent rounded-full" />
            </div>
        );
    }

    const moduleConfig = getModuleBySlug('rental-agreements');

    if (!moduleConfig) {
        return <div>Module not found</div>;
    }

    // Create a dummy submodule for rental agreements since it has no sub-modules
    const dummySubModule = {
        name: 'Rental Agreements',
        slug: 'default',
        apiEndpoint: 'rental-agreements',
        filePathPrefix: 'RNT/AGR',
    };

    return (
        <FilePageTemplate
            title="RENTAL AGREEMENTS"
            subModule={dummySubModule}
            user={user}
            moduleSlug="rental-agreements"
            submoduleSlug="default"
        />
    );
}
