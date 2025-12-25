import { describe, it, expect } from 'vitest';

describe('Example Test Suite', () => {
    it('should pass a basic assertion', () => {
        expect(1 + 1).toBe(2);
    });

    it('should verify string operations', () => {
        const appName = 'Muawin';
        expect(appName).toContain('Muawin');
        expect(appName.toLowerCase()).toBe('muawin');
    });

    it('should handle async operations', async () => {
        const promise = Promise.resolve('success');
        await expect(promise).resolves.toBe('success');
    });

    it('should work with arrays', () => {
        const modules = ['Users', 'Branches', 'Zones'];
        expect(modules).toHaveLength(3);
        expect(modules).toContain('Users');
    });

    it('should work with objects', () => {
        const user = {
            id: 1,
            name: 'Test User',
            role: 'admin',
        };
        expect(user).toHaveProperty('role', 'admin');
        expect(user.name).toBeDefined();
    });
});
