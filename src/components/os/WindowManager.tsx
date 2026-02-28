import { useOSStore } from '@/store/osStore';
import { useI18nStore } from '@/store/i18nStore';
import { CanvasWindow } from './CanvasWindow';
import { WindowContent } from './WindowContent';


export function WindowManager() {
    const windows = useOSStore(state => state.windows);
    const { t } = useI18nStore();

    return (
        <>
            {windows.map(window => (
                <CanvasWindow
                    key={window.id}
                    id={window.id}
                    title={t.modules[window.type]?.title || window.title}
                    initialPosition={window.position}
                    initialSize={window.size}
                    zIndex={window.zIndex}
                    minimized={window.minimized}
                    maximized={window.maximized}
                    minWidth={window.type === 'settings' ? 800 : 400}
                    minHeight={window.type === 'settings' ? 600 : 300}
                >
                    <WindowContent type={window.type} />
                </CanvasWindow>
            ))}
        </>
    );
}

