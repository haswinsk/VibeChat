import { LogOut, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { toastSuccess } from './ToastProvider';

const Navbar = () => {
  const { user, logout } = useAuthStore();

  const handleCopy = () => {
    if (user?.publicId) {
      navigator.clipboard.writeText(user.publicId);
      toastSuccess('Vibe ID copied to clipboard!');
    }
  };

  return (
    <header className="bg-dark-surface border-b border-dark-border py-3 px-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-xl">V</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">VibeChat</h1>
      </Link>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 border-l border-dark-border pl-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium text-gray-200">{user?.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">{user?.publicId}</span>
                <button onClick={handleCopy} className="text-gray-400 hover:text-white" title="Copy Vibe ID">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
