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
} from "lucide-react";
import configService from "../configService.js";

const UserManagement = ({ user, onUserUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(20160); // 2 weeks in minutes
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [backendUrl, setBackendUrl] = useState("");

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
      loadUserSettings();
    }
  }, [backendUrl]);

  const loadUserSettings = async () => {
    try {
      const response = await fetch(
        `${backendUrl}/api/users/${user.id}/settings`
      );
      if (response.ok) {
        const settings = await response.json();
        setTwoFAEnabled(settings.twoFAEnabled || false);
        setSessionTimeout(settings.sessionTimeout || 20160);
      }
    } catch (error) {
      console.error("Error loading user settings:", error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleProfileUpdate = async () => {
    if (!profileData.name.trim() || !profileData.email.trim()) {
      showMessage("error", "Name and email are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name.trim(),
          email: profileData.email.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const updatedUser = await response.json();
      onUserUpdate?.(updatedUser);
      showMessage("success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      showMessage("error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!profileData.currentPassword || !profileData.newPassword) {
      showMessage("error", "Current password and new password are required");
      return;
    }

    if (profileData.newPassword !== profileData.confirmPassword) {
      showMessage("error", "New passwords do not match");
      return;
    }

    if (profileData.newPassword.length < 8) {
      showMessage("error", "New password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/users/${user.id}/password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: profileData.currentPassword,
            newPassword: profileData.newPassword,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }

      setProfileData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      showMessage("success", "Password changed successfully");
    } catch (error) {
      console.error("Error changing password:", error);
      showMessage("error", error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFAToggle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/users/${user.id}/2fa`, {
        method: twoFAEnabled ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to update 2FA settings");

      setTwoFAEnabled(!twoFAEnabled);
      showMessage(
        "success",
        `2FA ${twoFAEnabled ? "disabled" : "enabled"} successfully`
      );
    } catch (error) {
      console.error("Error updating 2FA:", error);
      showMessage("error", "Failed to update 2FA settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionTimeoutUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/users/${user.id}/settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionTimeout }),
        }
      );

      if (!response.ok) throw new Error("Failed to update session timeout");

      showMessage("success", "Session timeout updated successfully");
    } catch (error) {
      console.error("Error updating session timeout:", error);
      showMessage("error", "Failed to update session timeout");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    if (!profileData.email.trim()) {
      showMessage("error", "Email is required for password recovery");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/auth/password-recovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profileData.email }),
      });

      if (!response.ok) throw new Error("Failed to send recovery email");

      showMessage("success", "Password recovery email sent successfully");
    } catch (error) {
      console.error("Error sending recovery email:", error);
      showMessage("error", "Failed to send recovery email");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Settings },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            User Management
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`p-4 border-b ${
              message.type === "success"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center space-x-2">
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleProfileUpdate}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>Update Profile</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Password Change */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Change Password
                </h3>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={profileData.currentPassword}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={profileData.newPassword}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Lock size={16} />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={handlePasswordRecovery}
                  disabled={loading}
                  className="ml-3 flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  <Mail size={16} />
                  <span>Send Recovery Email</span>
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Two-Factor Authentication
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button
                    onClick={handleTwoFAToggle}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      twoFAEnabled
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                    } disabled:opacity-50`}
                  >
                    {twoFAEnabled ? "Disable 2FA" : "Enable 2FA"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              {/* Session Timeout */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Session Settings
                </h3>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Session Timeout (minutes)
                  </label>
                  <select
                    value={sessionTimeout}
                    onChange={(e) =>
                      setSessionTimeout(parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={240}>4 hours</option>
                    <option value={480}>8 hours</option>
                    <option value={1440}>24 hours</option>
                    <option value={10080}>1 week</option>
                    <option value={20160}>2 weeks</option>
                  </select>
                  <p className="text-sm text-gray-500">
                    Your session will automatically expire after this period of
                    inactivity
                  </p>
                  <button
                    onClick={handleSessionTimeoutUpdate}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Clock size={16} />
                    <span>Update Timeout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
