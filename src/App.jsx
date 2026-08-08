import { RockhoundProvider } from './features/rockhound/RockhoundContext.jsx';
import Rockhound from './features/rockhound/components/Rockhound.jsx';
import DebugPanel from './shared/components/DebugPanel.jsx';

// The provider sits at the root rather than inside the feature so that state
// loads once at startup and the debug panel can dispatch into it.
export default function App() {
  return (
    <RockhoundProvider>
      <div className="flex min-h-screen flex-col bg-slate-900">
        <main className="container mx-auto w-full max-w-[1536px] flex-1 px-4 py-6 md:px-6">
          <Rockhound />
        </main>
        <DebugPanel />
      </div>
    </RockhoundProvider>
  );
}
