export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'mother' | 'doctor' | 'driver' | 'admin';
    status: 'active' | 'suspended' | 'pending';
    isVerified: boolean;
    joinedAt: any;
    lastActive: any;
}
