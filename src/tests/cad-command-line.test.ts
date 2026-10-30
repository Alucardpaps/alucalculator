import { beforeEach, describe, expect, it } from 'vitest';
import { commandProcessor } from '../cad/commands/CommandProcessor';
import { useCadStore } from '../cad/store/cadStore';
import { createLineEntity } from '../cad/kernel/types';

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('AluCAD command line', () => {
  beforeEach(() => {
    useCadStore.getState().clearEntities();
    commandProcessor.setActiveCommand(null);
  });

  it('switches to a command typed by name while another one runs, but keeps options and values', () => {
    commandProcessor.startCommand('CIRCLE');
    expect(commandProcessor.commandToSwitchTo('LINE')).toBe('LINE');
    expect(commandProcessor.commandToSwitchTo('trim')).toBe('TRIM');
    // option keywords and values stay with the running command
    for (const v of ['C', 'U', 'TTR', '2P', '0,0', '60', '@100,0', '50<30', '$width', 'CLOSE']) {
      expect(commandProcessor.commandToSwitchTo(v)).toBeNull();
    }
    expect(commandProcessor.commandToSwitchTo('NOTACOMMAND')).toBeNull();
  });

  it('starts a command with its first value from one line ("CIRCLE 0,0")', () => {
    commandProcessor.handleValueInput('CIRCLE 0,0');
    expect(commandProcessor.getActiveCommand()?.id).toBe('CIRCLE');
    commandProcessor.handleValueInput('25');
    const circles = useCadStore.getState().entities.filter((e) => e.geometry.type === 'CIRCLE');
    expect(circles).toHaveLength(1);
    expect((circles[0].geometry as { radius: number }).radius).toBe(25);
  });

  it('ERASE removes the selection at once, or picks objects one by one', async () => {
    const store = useCadStore.getState();
    const a = createLineEntity({ x: 0, y: 0 }, { x: 100, y: 0 }, 'layer-0', '#ffffff');
    const b = createLineEntity({ x: 0, y: 50 }, { x: 100, y: 50 }, 'layer-0', '#ffffff');
    store.addEntity(a);
    store.addEntity(b);

    useCadStore.getState().selectEntity(a.id);
    commandProcessor.startCommand('E');
    expect(useCadStore.getState().entities.map((e) => e.id)).toEqual([b.id]);
    expect(useCadStore.getState().commandPrompt).toBe('Erased 1 object');

    commandProcessor.startCommand('ERASE');
    expect(commandProcessor.getActiveCommand()?.id).toBe('ERASE');
    commandProcessor.handlePointInput({ x: 50, y: 50 });
    expect(useCadStore.getState().entities).toHaveLength(0);
    commandProcessor.handleKeyInput('Enter');
    await flush();
    expect(useCadStore.getState().activeCommand).toBeNull();
  });

  it('UNDO / REDO / ZOOM run immediately instead of failing as unknown commands', () => {
    const store = useCadStore.getState();
    store.addEntity(createLineEntity({ x: 0, y: 0 }, { x: 10, y: 0 }, 'layer-0', '#ffffff'));
    expect(useCadStore.getState().entities).toHaveLength(1);
    commandProcessor.startCommand('U');
    expect(useCadStore.getState().entities).toHaveLength(0);
    commandProcessor.startCommand('REDO');
    expect(useCadStore.getState().entities).toHaveLength(1);
    commandProcessor.startCommand('Z');
    expect(useCadStore.getState().commandPrompt).toBe('Zoom extents');
    expect(useCadStore.getState().commandPrompt.startsWith('Unknown')).toBe(false);
  });
});
