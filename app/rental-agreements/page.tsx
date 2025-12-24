'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/context/UserContext';
import FilePageTemplate from '@/components/modules/FilePageTemplate';
import { getModuleBySlug } from '@/lib/config/moduleConfig';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function RentalAgreementsPage() {
    const { user, loading } = useUser();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || loading) {
        return <LoadingScreen />;
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
