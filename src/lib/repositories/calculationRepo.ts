import { pool } from "../db";
import { mockStorage } from "./mockStorage";
import { v4 as uuidv4 } from 'uuid';

export const calculationRepo = {
    async save(projectId: string, type: string, inputJson: any, engineVersion: string, resultJson: any = null) {
        try {
            const query = `
                INSERT INTO calculations (project_id, type, input_json, engine_version, result_json)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            const values = [projectId, type, JSON.stringify(inputJson), engineVersion, resultJson ? JSON.stringify(resultJson) : null];
            const res = await pool.query(query, values);
            
            if ((res as any).isMock) {
                const calc = { 
                    id: uuidv4(), 
                    project_id: projectId, 
                    type, 
                    input_json: inputJson, 
                    engine_version: engineVersion, 
                    result_json: resultJson,
                    created_at: new Date().toISOString() 
                };
                mockStorage.upsert('calculations', calc);
                return calc;
            }

            return res.rows[0];
        } catch (err) {
            // Ultimate fallback
            const calc = { id: uuidv4(), project_id: projectId, type, input_json: inputJson, engine_version: engineVersion, result_json: resultJson, created_at: new Date().toISOString() };
            mockStorage.upsert('calculations', calc);
            return calc;
        }
    },

    async findById(id: string) {
        const res = await pool.query(`SELECT * FROM calculations WHERE id = $1;`, [id]);
        if ((res as any).isMock) {
            return mockStorage.get<any>('calculations').find(c => c.id === id);
        }
        return res.rows[0];
    },

    async listByProject(projectId: string) {
        const res = await pool.query(`SELECT * FROM calculations WHERE project_id = $1 ORDER BY created_at DESC;`, [projectId]);
        if ((res as any).isMock) {
            return mockStorage.get<any>('calculations').filter(c => c.project_id === projectId);
        }
        return res.rows;
    }
};
