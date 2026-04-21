import { query } from '@/lib/db';
import { mockStorage } from './mockStorage';
import { v4 as uuidv4 } from 'uuid';

export interface Project {
    id: string;
    user_id: string;
    name: string;
    created_at: Date;
}

export const projectRepo = {
    async listByUser(userId: string): Promise<Project[]> {
        const res = await query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        if ((res as any).isMock) {
            return mockStorage.get<Project>('projects').filter(p => p.user_id === userId);
        }
        return res.rows;
    },

    async create(userId: string, name: string): Promise<Project> {
        try {
            const res = await query(`
                INSERT INTO projects (user_id, name)
                VALUES ($1, $2)
                RETURNING *
            `, [userId, name]);

            if ((res as any).isMock) {
                const project: Project = { 
                    id: uuidv4(), 
                    user_id: userId, 
                    name, 
                    created_at: new Date() 
                };
                mockStorage.upsert('projects', project);
                return project;
            }
            return res.rows[0];
        } catch (err) {
            const project: Project = { id: uuidv4(), user_id: userId, name, created_at: new Date() };
            mockStorage.upsert('projects', project);
            return project;
        }
    },

    async findById(projectId: string, userId: string): Promise<Project | null> {
        const res = await query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [projectId, userId]);
        if ((res as any).isMock) {
            return mockStorage.get<Project>('projects').find(p => p.id === projectId && p.user_id === userId) || null;
        }
        return res.rows[0] || null;
    },

    async ensureDefaultProject(userId: string): Promise<Project> {
        const projects = await this.listByUser(userId);
        if (projects.length > 0) return projects[0];

        return await this.create(userId, 'My First Project');
    }
};
