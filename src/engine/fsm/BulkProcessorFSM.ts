import { EngineeringCopilot } from '../copilot/copilot';
import { HeadlessEngine, EngineResult } from '../../headless-engine/engine';

export enum BulkState {
    IDLE,
    PARSING_INTENT,
    ROUTING,
    COMPUTING,
    RESPONDING,
    ERROR
}

export interface BulkPayload {
    queries?: string[];
    rows?: Record<string, number>[];
    calculator?: string;
}

export interface BulkProcessResult {
    success: boolean;
    type: string;
    results: any[];
    error?: string;
}

export class BulkProcessorFSM {
    private state: BulkState = BulkState.IDLE;
    private payload: BulkPayload;
    
    private copilot: EngineeringCopilot;
    private engine: HeadlessEngine;

    private context: BulkProcessResult = {
        success: false,
        type: 'unknown',
        results: []
    };

    constructor(payload: BulkPayload) {
        this.payload = payload;
        this.copilot = new EngineeringCopilot();
        this.engine = new HeadlessEngine();
    }

    /**
     * Executes the state machine asynchronously to resolve the bulk API request.
     */
    public async execute(): Promise<BulkProcessResult> {
        try {
            this.transition(BulkState.PARSING_INTENT);
            await this.handleParsingIntent();

            if (this.state === BulkState.ROUTING) {
                await this.handleRouting();
            }

            if (this.state === BulkState.COMPUTING) {
                await this.handleComputing();
            }

            this.transition(BulkState.RESPONDING);
            return this.context;
            
        } catch (error: any) {
            this.transition(BulkState.ERROR);
            this.context.success = false;
            this.context.error = error.message;
            return this.context;
        }
    }

    private transition(newState: BulkState) {
        // Implementation of generic validation could happen here
        this.state = newState;
    }

    private async handleParsingIntent() {
        if (!this.payload || (!this.payload.queries && !this.payload.rows)) {
            throw new Error("Invalid payload: Missing 'queries' or 'rows'.");
        }
        this.transition(BulkState.ROUTING);
    }

    private async handleRouting() {
        if (Array.isArray(this.payload.queries) && this.payload.queries.length > 0) {
            this.context.type = 'ai-batch';
            this.transition(BulkState.COMPUTING);
        } else if (this.payload.calculator && Array.isArray(this.payload.rows)) {
            this.context.type = 'standard-batch';
            this.transition(BulkState.COMPUTING);
        } else {
            throw new Error("Invalid routing parameters: Mismatched keys.");
        }
    }

    private async handleComputing() {
        if (this.context.type === 'ai-batch' && this.payload.queries) {
            // Natural Language Mode
            this.context.results = this.payload.queries.map(query => {
                const intent = this.copilot.parseAndAssume(query);
                
                // For AI batch, we map the intent to an implicit headless structural execution.
                // Fallback to "beam-deflection" generic adapter for intent processing
                const simulatedInputs = {
                    E: 70000, 
                    I: 100000, 
                    force: intent.forceApplied || 1000,
                    length: intent.length || 1000
                };
                
                // Leverage the formal HeadlessEngine
                const calcResult = this.engine.execute('beam-deflection', simulatedInputs);

                return {
                    query,
                    assumptionsMade: intent.assumptionsMade,
                    computation: calcResult
                };
            });

        } else if (this.context.type === 'standard-batch' && this.payload.calculator && this.payload.rows) {
            // Explicit Headless Compute Mode
            const calcId = this.payload.calculator;
            
            this.context.results = this.payload.rows.map(row => {
               const calcResult = this.engine.execute(calcId, row);
               return {
                   inputs: row,
                   computation: calcResult
               };
            });
        }
        
        this.context.success = true;
    }
}
