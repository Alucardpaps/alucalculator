import { query } from '@/lib/db';

export interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    created_at: Date;
}

export const userRepo = {
    async findByEmail(email: string): Promise<User | null> {
        const res = await query('SELECT * FROM users WHERE email = $1', [email]);
        return res.rows[0] || null;
    },

    async findById(id: string): Promise<User | null> {
        const res = await query('SELECT * FROM users WHERE id = $1', [id]);
        return res.rows[0] || null;
    },

    async createOrUpdate(userData: { email: string; name?: string; image?: string }): Promise<User> {
        const { email, name, image } = userData;
        
        // Upsert user
        const res = await query(`
            INSERT INTO users (email, name, image)
            VALUES ($1, $2, $3)
            ON CONFLICT (email) DO UPDATE
            SET name = EXCLUDED.name, image = EXCLUDED.image
            RETURNING *
        `, [email, name, image]);

        return res.rows[0];
    }
};
