import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Shield,
  Clock,
  Key,
  Settings,
  Save,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  HardDrive,
  Database,
  Users,
  UserX,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import configService from "../configService.js";

const AdminInterface = ({ user, onClose }) => {
  const [activeSection, setActiveSection] = useState("users");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [backendUrl, setBackendUrl] = useState("");

  // User Management State
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    isAdmin: false,
  });
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
    name: "",
    email: "",
    isAdmin: false,
  });

  // Data Management State
  const [storageLocation, setStorageLocation] = useState("");
  const [diskUsage, setDiskUsage] = useState([]);

  // Version Management State
  const [versionConfig, setVersionConfig] = useState({
    maxVersionsPerNote: 100,
    autoVersionOnChange: true,
    minChangePercentage: 5,
    enableFocusSwitch: true,
  });

  // Auto-save Management State
  const [autoSaveConfig, setAutoSaveConfig] = useState({
    autoSaveDelayMs: 10000,
    minChangePercentage: 5,
    enableAutoSave: true,
    enableBeforeUnloadSave: true,
  });

  // Initialize backend URL
  useEffect(() => {
    const initBackendUrl = async () => {
      try {
        const url = await configService.getBackendUrl();
        setBackendUrl(url);
      } catch (error) {
        console.error("Failed to get backend URL:", error);
        setBackendUrl("http://localhost:3004"); // fallback
      }
    };
    initBackendUrl();
  }, []);

  useEffect(() => {
    if (backendUrl) {
      loadUsers();
      loadStorageInfo();
      loadVersionConfig();
      loadAutoSaveConfig();
    }
  }, [backendUrl]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  // User Management Functions
  const loadUsers = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${user.id}`, // Simple auth for demo
        },
      });

      if (!response.ok) throw new Error("Failed to load users");

      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
      showMessage("error", "Failed to load users");
    }
  };

  const addUser = async () => {
    if (!newUserData.name.trim() || !newUserData.email.trim()) {
      showMessage("error", "Name and email are required");
      return;
    }

    if (!newUserData.password || newUserData.password.length < 6) {
      showMessage("error", "Password must be at least 6 characters long");
      return;
    }

    if (newUserData.password !== newUserData.confirmPassword) {
      showMessage("error", "Passwords do not match");
      return;
    }

    const emailExists = users.some(
      (u) => u.email.toLowerCase() === newUserData.email.toLowerCase()
    );
    if (emailExists) {
      showMessage("error", "Email already exists");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          name: newUserData.name.trim(),
          email: newUserData.email.trim(),
          password: newUserData.password,
          isAdmin: newUserData.isAdmin,
        }),
      });

      if (!response.ok) throw new Error("Failed to add user");

      const createdUser = await response.json();
      setUsers((prev) => [...prev, createdUser]);
      setNewUserData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        isAdmin: false,
      });
      setShowAddUser(false);
      showMessage("success", `User ${createdUser.name} created successfully`);
    } catch (error) {
      console.error("Error adding user:", error);
      showMessage("error", "Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  const disableUser = async (userId) => {
    if (!confirm("Are you sure you want to disable this user?")) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/users/${userId}/disable`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.id}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to disable user");

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, disabled: true } : u))
      );
      showMessage("success", "User disabled successfully");
    } catch (error) {
      console.error("Error disabling user:", error);
      showMessage("error", "Failed to disable user");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return;

    if (
      !confirm(
        `Are you sure you want to DELETE user "${userToDelete.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete user");

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showMessage("success", `User ${userToDelete.name} deleted successfully`);
    } catch (error) {
      console.error("Error deleting user:", error);
      showMessage("error", "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (userId) => {
    const userToReset = users.find((u) => u.id === userId);
    if (!userToReset) return;

    const newPassword = prompt(`Enter new password for ${userToReset.name}:`);
    if (!newPassword || newPassword.length < 6) {
      showMessage("error", "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/users/${userId}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.id}`,
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      if (!response.ok) throw new Error("Failed to reset password");

      showMessage("success", `Password reset for ${userToReset.name}`);
    } catch (error) {
      console.error("Error resetting password:", error);
      showMessage("error", "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const startEditUser = (userData) => {
    setEditingUser(userData.id);
    setEditUserData({
      name: userData.name,
      email: userData.email,
      isAdmin: userData.isAdmin,
    });
  };

  const cancelEditUser = () => {
    setEditingUser(null);
    setEditUserData({
      name: "",
      email: "",
      isAdmin: false,
    });
  };

  const saveEditUser = async () => {
    if (!editUserData.name.trim() || !editUserData.email.trim()) {
      showMessage("error", "Name and email are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/users/${editingUser}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.id}`,
          },
          body: JSON.stringify({
            name: editUserData.name.trim(),
            email: editUserData.email.trim(),
            isAdmin: editUserData.isAdmin,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      const updatedUser = await response.json();

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser ? { ...u, ...updatedUser } : u))
      );

      setEditingUser(null);
      setEditUserData({
        name: "",
        email: "",
        isAdmin: false,
      });

      showMessage("success", `User ${updatedUser.name} updated successfully`);
    } catch (error) {
      console.error("Error updating user:", error);
      showMessage("error", error.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  // Data Management Functions
  const loadStorageInfo = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/storage`, {
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load storage info");

      const storageData = await response.json();
      setStorageLocation(storageData.location);
      setDiskUsage(storageData.userUsage || []);
    } catch (error) {
      console.error("Error loading storage info:", error);
      showMessage("error", "Failed to load storage information");
    }
  };

  const updateStorageLocation = async () => {
    const newLocation = prompt("Enter new storage location:", storageLocation);
    if (!newLocation || newLocation === storageLocation) return;

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/storage/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({ location: newLocation }),
      });

      if (!response.ok) throw new Error("Failed to update storage location");

      setStorageLocation(newLocation);
      showMessage("success", "Storage location updated successfully");
    } catch (error) {
      console.error("Error updating storage location:", error);
      showMessage("error", "Failed to update storage location");
    } finally {
      setLoading(false);
    }
  };

  // Version Management Functions
  const loadVersionConfig = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/config/versions`, {
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load version config");

      const config = await response.json();
      setVersionConfig(config);
    } catch (error) {
      console.error("Error loading version config:", error);
      showMessage("error", "Failed to load version configuration");
    }
  };

  const updateVersionConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/config/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify(versionConfig),
      });

      if (!response.ok) throw new Error("Failed to update version config");

      const updatedConfig = await response.json();
      setVersionConfig(updatedConfig);
      showMessage("success", "Version configuration updated successfully");
    } catch (error) {
      console.error("Error updating version config:", error);
      showMessage("error", "Failed to update version configuration");
    } finally {
      setLoading(false);
    }
  };

  // Auto-save Management Functions
  const loadAutoSaveConfig = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/config/auto-save`, {
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load auto-save config");

      const config = await response.json();
      setAutoSaveConfig(config);
    } catch (error) {
      console.error("Error loading auto-save config:", error);
      showMessage("error", "Failed to load auto-save configuration");
    }
  };

  const updateAutoSaveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/config/auto-save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify(autoSaveConfig),
      });

      if (!response.ok) throw new Error("Failed to update auto-save config");

      const updatedConfig = await response.json();
      setAutoSaveConfig(updatedConfig);
      showMessage("success", "Auto-save configuration updated successfully");
    } catch (error) {
      console.error("Error updating auto-save config:", error);
      showMessage("error", "Failed to update auto-save configuration");
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: "users", label: "User Administration", icon: Users },
    { id: "data", label: "Data Management", icon: Database },
    { id: "versions", label: "Version Control", icon: Clock },
    { id: "autosave", label: "Auto-save Settings", icon: Save },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Admin Interface</h2>
            <p className="text-red-100">System Administration Panel</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className="p-4">
            <div
              className={`rounded-lg p-3 flex items-center space-x-2 ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle size={16} className="text-green-600" />
              ) : (
                <AlertTriangle size={16} className="text-red-600" />
              )}
              <span
                className={`text-sm ${
                  message.type === "success" ? "text-green-700" : "text-red-700"
                }`}
              >
                {message.text}
              </span>
            </div>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex border-b border-gray-200">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <section.icon size={16} />
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeSection === "users" && (
            <div className="space-y-6">
              {/* Add User Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  User Management
                </h3>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <UserPlus size={16} />
                  <span>Add User</span>
                </button>
              </div>

              {/* Add User Form */}
              {showAddUser && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h4 className="font-medium text-gray-900">Add New User</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newUserData.name}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={newUserData.email}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={newUserData.password}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={newUserData.confirmPassword}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isAdmin"
                      checked={newUserData.isAdmin}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          isAdmin: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="isAdmin" className="text-sm text-gray-700">
                      Admin privileges
                    </label>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={addUser}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>Create User</span>
                    </button>
                    <button
                      onClick={() => setShowAddUser(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Edit User Form */}
              {editingUser && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-4 border border-blue-200">
                  <h4 className="font-medium text-gray-900">
                    Edit User Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={editUserData.name}
                      onChange={(e) =>
                        setEditUserData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={editUserData.email}
                      onChange={(e) =>
                        setEditUserData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="editIsAdmin"
                      checked={editUserData.isAdmin}
                      onChange={(e) =>
                        setEditUserData((prev) => ({
                          ...prev,
                          isAdmin: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="editIsAdmin"
                      className="text-sm text-gray-700"
                    >
                      Admin privileges
                    </label>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={saveEditUser}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={cancelEditUser}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userData) => (
                      <tr key={userData.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User size={16} className="text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {userData.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userData.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              userData.isAdmin
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {userData.isAdmin ? "Admin" : "User"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              userData.disabled
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {userData.disabled ? "Disabled" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => startEditUser(userData)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-900"
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => disableUser(userData.id)}
                            disabled={userData.disabled || loading}
                            className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                            title="Disable User"
                          >
                            <UserX size={16} />
                          </button>
                          <button
                            onClick={() => resetPassword(userData.id)}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-900"
                            title="Reset Password"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            onClick={() => deleteUser(userData.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === "data" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Data Management
              </h3>

              {/* Storage Location */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Storage Location
                </h4>
                <div className="flex items-center space-x-4">
                  <code className="bg-white px-3 py-2 rounded border text-sm flex-1">
                    {storageLocation || "Loading..."}
                  </code>
                  <button
                    onClick={updateStorageLocation}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Settings size={16} />
                    <span>Change</span>
                  </button>
                </div>
              </div>

              {/* Disk Usage */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">
                  Disk Usage by User
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attachments
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Size
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {diskUsage.map((usage) => (
                        <tr key={usage.userId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {usage.userName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usage.noteCount} notes
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usage.attachmentCount} files
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usage.totalSize}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === "versions" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Version Control Configuration
              </h3>

              {/* Version Limits */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">
                  Version Management
                </h4>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Versions Per Note
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={versionConfig.maxVersionsPerNote}
                      onChange={(e) =>
                        setVersionConfig((prev) => ({
                          ...prev,
                          maxVersionsPerNote: parseInt(e.target.value) || 100,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Older versions will be automatically deleted when this
                      limit is exceeded
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Change Percentage
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={versionConfig.minChangePercentage}
                      onChange={(e) =>
                        setVersionConfig((prev) => ({
                          ...prev,
                          minChangePercentage: parseInt(e.target.value) || 5,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Percentage of content change required to trigger a new
                      version
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="autoVersionOnChange"
                      checked={versionConfig.autoVersionOnChange}
                      onChange={(e) =>
                        setVersionConfig((prev) => ({
                          ...prev,
                          autoVersionOnChange: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="autoVersionOnChange"
                      className="text-sm text-gray-700"
                    >
                      Enable automatic versioning on content changes
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="enableFocusSwitch"
                      checked={versionConfig.enableFocusSwitch}
                      onChange={(e) =>
                        setVersionConfig((prev) => ({
                          ...prev,
                          enableFocusSwitch: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="enableFocusSwitch"
                      className="text-sm text-gray-700"
                    >
                      Create version when switching between notes
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={updateVersionConfig}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Settings size={16} />
                    <span>Update Configuration</span>
                  </button>
                </div>
              </div>

              {/* Version Statistics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">
                  Version Statistics
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">-</div>
                    <div className="text-sm text-gray-600">Total Versions</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">-</div>
                    <div className="text-sm text-gray-600">Active Notes</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">-</div>
                    <div className="text-sm text-gray-600">
                      Avg Versions/Note
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Version statistics will be available in a future update
                </p>
              </div>
            </div>
          )}

          {activeSection === "autosave" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Auto-save Configuration
              </h3>

              {/* Auto-save Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">
                  Auto-save Behavior
                </h4>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-save Delay (seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={Math.round(autoSaveConfig.autoSaveDelayMs / 1000)}
                      onChange={(e) =>
                        setAutoSaveConfig((prev) => ({
                          ...prev,
                          autoSaveDelayMs:
                            (parseInt(e.target.value) || 10) * 1000,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Time to wait after typing stops before saving (1-300
                      seconds)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Change Percentage
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={autoSaveConfig.minChangePercentage}
                      onChange={(e) =>
                        setAutoSaveConfig((prev) => ({
                          ...prev,
                          minChangePercentage: parseInt(e.target.value) || 5,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum content change percentage required for auto-save
                      (0% = save all changes)
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="enableAutoSave"
                      checked={autoSaveConfig.enableAutoSave}
                      onChange={(e) =>
                        setAutoSaveConfig((prev) => ({
                          ...prev,
                          enableAutoSave: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="enableAutoSave"
                      className="text-sm text-gray-700"
                    >
                      Enable automatic saving after typing delays
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="enableBeforeUnloadSave"
                      checked={autoSaveConfig.enableBeforeUnloadSave}
                      onChange={(e) =>
                        setAutoSaveConfig((prev) => ({
                          ...prev,
                          enableBeforeUnloadSave: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="enableBeforeUnloadSave"
                      className="text-sm text-gray-700"
                    >
                      Save automatically when closing browser/tab
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={updateAutoSaveConfig}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Settings size={16} />
                    <span>Update Auto-save Configuration</span>
                  </button>
                </div>
              </div>

              {/* Auto-save Performance Information */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">
                  Performance Guidelines
                </h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>
                    <strong>Recommended Settings:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      <strong>Auto-save Delay:</strong> 10-30 seconds for
                      balanced performance
                    </li>
                    <li>
                      <strong>Change Threshold:</strong> 5-10% to avoid
                      excessive saves
                    </li>
                    <li>
                      <strong>Browser Close Save:</strong> Always enabled for
                      data protection
                    </li>
                  </ul>
                  <p className="mt-3">
                    <strong>⚠️ Warning:</strong> Very short delays (&lt; 5
                    seconds) may impact server performance with heavy usage.
                  </p>
                </div>
              </div>

              {/* Current Auto-save Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">
                  Current Configuration Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-medium text-gray-700">
                      Auto-save Delay
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                      {(autoSaveConfig.autoSaveDelayMs / 1000).toFixed(1)}s
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-medium text-gray-700">
                      Change Threshold
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      {autoSaveConfig.minChangePercentage}%
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-medium text-gray-700">
                      Auto-save Status
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        autoSaveConfig.enableAutoSave
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {autoSaveConfig.enableAutoSave ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-medium text-gray-700">
                      Browser Close Save
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        autoSaveConfig.enableBeforeUnloadSave
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {autoSaveConfig.enableBeforeUnloadSave
                        ? "Enabled"
                        : "Disabled"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInterface;
