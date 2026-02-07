import { useOSStore } from '@/store/osStore';
import { CanvasWindow } from './CanvasWindow';
import { WindowContent } from './WindowContent';

export function WindowManager() {
    const windows = useOSStore(state => state.windows);

    return (
        <>
            {windows.map(window => (
                <CanvasWindow
                    key={window.id}
                    id={window.id}
                    title={window.title}
                    initialPosition={window.position}
                    initialSize={window.size}
                    zIndex={window.zIndex}
                    minimized={window.minimized}
                >
                    <WindowContent type={window.type} />
                </CanvasWindow>
            ))}
        </>
    );
}
