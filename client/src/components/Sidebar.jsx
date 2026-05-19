import { useEffect, useState } from 'react';
import useChatStore from '../store/useChatStore';
import { Search } from 'lucide-react';
import api from '../services/api';
import useDebounce from '../hooks/useDebounce'; // Assuming a debounce hook exists

const SearchResultItem = ({ user, onSelect }) => (
  <button
    onClick={() => onSelect(user)}
    className="w-full p-4 flex items-center gap-3 hover:bg-dark-surface transition-colors border-b border-dark-border/50"
  >
    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
      {user.profilePic ? (
        <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
      ) : (
        user.name.charAt(0).toUpperCase()
      )}
    </div>
    <div className="flex-1 min-w-0 text-left">
      <h3 className="text-sm font-medium text-white truncate">{user.name}</h3>
      <p className="text-xs text-gray-400 truncate">{user.publicId}</p>
    </div>
    <button className="ml-auto bg-primary text-white text-xs font-bold px-3 py-1 rounded-full hover:bg-primary/80">
      Connect
    </button>
  </button>
);

const Sidebar = () => {
  const { users, getUsers, selectedUser, setSelectedUser, isUsersLoading, resetUnreadCount, addUser } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    console.log('[SIDEBAR] Mounting, fetching users');
    getUsers();
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (debouncedSearchQuery.length > 2) {
        setIsSearching(true);
        try {
          const { data } = await api.get(`/users/search?query=${debouncedSearchQuery}`);
          setSearchResults(data);
        } catch (error) {
          console.error('Error searching users:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    searchUsers();
  }, [debouncedSearchQuery]);

  const handleSelectUser = (user) => {
    addUser(user); // Add to conversation list
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (isUsersLoading) {
    return (
      <div className="w-80 border-r border-dark-border bg-dark-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <aside className={`w-full md:w-80 h-full border-r border-dark-border bg-dark-bg flex-col flex-shrink-0 transition-all duration-300 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 border-b border-dark-border">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors text-sm"
            placeholder="Search by Vibe ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searchQuery.length > 0 ? (
          isSearching ? (
            <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
          ) : (
            searchResults.map((user) => (
              <SearchResultItem key={user._id} user={user} onSelect={handleSelectUser} />
            ))
          )
        ) : (
          users.map((user) => (
            <button
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                resetUnreadCount(user._id);
              }}
              className={`w-full p-4 flex items-center gap-3 hover:bg-dark-surface transition-colors border-b border-dark-border/50
                ${selectedUser?._id === user._id ? 'bg-dark-surface border-l-4 border-l-primary' : ''}
              `}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                {user.onlineStatus && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-dark-bg rounded-full"></span>
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-sm font-medium text-white truncate">{user.name}</h3>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {user.onlineStatus ? 'Online' : 'Offline'}
                </p>
              </div>

              {user.unreadCount > 0 && (
                <span className="ml-auto bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse shadow-md">
                  {user.unreadCount}
                </span>
              )}
            </button>
          ))
        )}

        {searchQuery.length > 0 && !isSearching && searchResults.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">No users found.</div>
        )}

        {searchQuery.length === 0 && users.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No conversations yet. Find someone to chat with!
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
