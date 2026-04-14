/**
 * ui/ribbon/RibbonAPI.ts
 * 
 * Allows modules to dynamically register commands, tools, and actions into the 
 * OS Ribbon Bar based on the active workspace context.
 */

export interface RibbonCommand {
    id: string;
    label: string;
    icon: string;
    category: string; // Creates a Ribbon Tab or Group
    shortcut?: string;
    action: () => void;
    isDisabled?: () => boolean;
}

export class RibbonAPI {
    private static _commands: Map<string, RibbonCommand[]> = new Map();

    /**
     * Registers a set of commands for a specific module or workspace mode
     */
    static registerCommands(contextId: string, commands: RibbonCommand[]) {
        const existing = this._commands.get(contextId) || [];
        // Prevent dupes by ID
        const newCommands = commands.filter(c => !existing.some(e => e.id === c.id));
        this._commands.set(contextId, [...existing, ...newCommands]);
    }

    /**
     * Retrieves commands for the current active context
     */
    static getCommands(contextId: string): RibbonCommand[] {
        return this._commands.get(contextId) || [];
    }

    /**
     * Triggers a command by its precise ID
     */
    static executeCommand(commandId: string) {
        for (const [_, cmds] of this._commands.entries()) {
            const cmd = cmds.find(c => c.id === commandId);
            if (cmd && (!cmd.isDisabled || !cmd.isDisabled())) {
                cmd.action();
                return true;
            }
        }
        return false;
    }
}
