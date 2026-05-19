import { useEffect, useState } from 'react';
import { Users, MessageSquare, Radio, Zap, LogOut, Trash2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, usersRes, activityRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/activity')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.slice(0, 10));
      setActivity(activityRes.data);
    } catch (err) {
      console.error('[ADMIN] Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear admin token
    localStorage.removeItem('admin-token');
    
    // Logout from auth store
    logout();
    
    // Redirect to login
    window.location.href = '/admin-login';
  };

  const handleToggleBan = async (userId, userName, isBanned) => {
    const action = isBanned ? 'unban' : 'ban';
    if (window.confirm(`Are you sure you want to ${action} user "${userName}"?`)) {
      try {
        await api.put(`/admin/users/${userId}/toggle-ban`);
        console.log(`[ADMIN] User ${action}ned: ${userName}`);
        // Refresh users list
        fetchAdminData();
      } catch (err) {
        console.error(`[ADMIN] Error ${action}ning user:`, err);
        alert(`Failed to ${action} user: ${err.response?.data?.message || 'Unknown error'}`);
      }
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-6 rounded-lg max-w-md">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Hidden System - Authorized Access Only</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 hover:border-primary/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="w-10 h-10 text-primary/30" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.onlineUsers || 0} online now
            </p>
          </div>

          {/* Total Messages */}
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 hover:border-primary/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Messages</p>
                <p className="text-3xl font-bold">{stats?.totalMessages || 0}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-blue-500/30" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.messagesLast24h || 0} in last 24h
            </p>
          </div>

          {/* Active Music Rooms */}
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 hover:border-primary/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Music Rooms</p>
                <p className="text-3xl font-bold">{stats?.activeMusicRooms || 0}</p>
              </div>
              <Radio className="w-10 h-10 text-pink-500/30" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.totalRooms || 0} total
            </p>
          </div>

          {/* System Status */}
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 hover:border-primary/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">System Status</p>
                <p className="text-3xl font-bold text-green-500">Active</p>
              </div>
              <Zap className="w-10 h-10 text-green-500/30" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              All systems operational
            </p>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-4 text-gray-400">Name</th>
                  <th className="text-left py-3 px-4 text-gray-400">Email</th>
                  <th className="text-left py-3 px-4 text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400">Admin</th>
                  <th className="text-left py-3 px-4 text-gray-400">Joined</th>
                  <th className="text-center py-3 px-4 text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className={`border-b border-dark-border hover:bg-dark-bg transition ${u.isBanned ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-4 font-medium">{u.name}</td>
                    <td className="py-3 px-4 text-gray-400">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.isBanned
                          ? 'bg-red-500/20 text-red-400'
                          : u.onlineStatus
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {u.isBanned ? 'Banned' : u.onlineStatus ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.isAdmin ? (
                        <span className="text-primary font-bold">✓ Admin</span>
                      ) : (
                        <span className="text-gray-500">User</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!u.isAdmin && (
                        <button
                          onClick={() => handleToggleBan(u._id, u.name, u.isBanned)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded transition text-xs font-medium ${
                            u.isBanned
                              ? 'bg-green-600/20 hover:bg-green-600/40 text-green-400 hover:text-green-300'
                              : 'bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300'
                          }`}
                          title={u.isBanned ? 'Unban User' : 'Ban User'}
                        >
                          {u.isBanned ? <Zap className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Section */}
        {activity && (
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Recent Messages</p>
                <p className="text-2xl font-bold">{activity.messageActivityCount}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Recent Users</p>
                <p className="text-2xl font-bold">{activity.userActivityCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4 text-gray-500 text-sm border-t border-dark-border">
          <p>Last updated: {stats?.timestamp ? new Date(stats.timestamp).toLocaleTimeString() : 'Loading...'}</p>
          <p className="mt-2">This dashboard is hidden from regular users</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
