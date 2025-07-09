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
  UserCog,
  Search,
  FileX,
  Archive,
  History,
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
  const [diskUsage, setDiskUsage] = useState({
    users: [],
    systemTotals: {},
    lastRefreshed: null,
  });
  const [showStorageLocationModal, setShowStorageLocationModal] =
    useState(false);
  const [newStorageLocation, setNewStorageLocation] = useState("");
  const [storageLocationValidation, setStorageLocationValidation] = useState({
    isValid: true,
    message: "",
    isValidating: false,
  });

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

  // User Operations State
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    onConfirm: null,
    requiresTyping: false,
  });
  const [confirmTypedText, setConfirmTypedText] = useState("");
  const [bulkOperations, setBulkOperations] = useState({
    clearUnknownTags: false,
    deleteAllNotes: false,
    deleteAllAttachments: false,
    resetOTP: false,
  });

  // Access History State
  const [accessHistory, setAccessHistory] = useState([]);
  const [showAccessHistory, setShowAccessHistory] = useState(false);
  const [accessHistoryLoading, setAccessHistoryLoading] = useState(false);
  const [accessHistoryPagination, setAccessHistoryPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  // Backup System State
  const [backupConfig, setBackupConfig] = useState({
    enableAutoBackup: true,
    backupBeforeDestruction: true,
    maxBackupsPerUser: 10,
    backupLocation: "backups",
  });
  const [backupStatus, setBackupStatus] = useState({
    isCreating: false,
    lastBackupTime: null,
    backupCount: 0,
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
      loadBackupConfig();
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

      // Store the enhanced data structure
      setDiskUsage({
        users: storageData.userUsage || [],
        systemTotals: storageData.systemTotals || {},
        lastRefreshed: storageData.lastRefreshed || new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error loading storage info:", error);
      showMessage("error", "Failed to load storage information");
    }
  };

  const validateStorageLocation = async (location) => {
    if (!location || location.trim() === "") {
      return { isValid: false, message: "Storage location is required" };
    }

    const trimmedLocation = location.trim();

    // Basic path validation
    if (trimmedLocation.includes("..") || trimmedLocation.includes("~")) {
      return {
        isValid: false,
        message: "Relative paths and home directory shortcuts are not allowed",
      };
    }

    // Check if path is absolute
    if (
      !trimmedLocation.startsWith("/") &&
      !trimmedLocation.match(/^[A-Za-z]:\\/)
    ) {
      return { isValid: false, message: "Please provide an absolute path" };
    }

    // Try to validate the path with the backend
    try {
      const response = await fetch(`${backendUrl}/api/admin/storage/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({ location: trimmedLocation }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          isValid: false,
          message: errorData.error || "Invalid storage location",
        };
      }

      const validationResult = await response.json();
      return {
        isValid: true,
        message: validationResult.message || "Location is valid",
      };
    } catch (error) {
      return { isValid: false, message: "Failed to validate location" };
    }
  };

  const handleStorageLocationChange = async (location) => {
    setNewStorageLocation(location);

    if (!location || location.trim() === "") {
      setStorageLocationValidation({
        isValid: true,
        message: "",
        isValidating: false,
      });
      return;
    }

    setStorageLocationValidation({
      isValid: true,
      message: "",
      isValidating: true,
    });

    const validation = await validateStorageLocation(location);
    setStorageLocationValidation({
      isValid: validation.isValid,
      message: validation.message,
      isValidating: false,
    });
  };

  const updateStorageLocation = async () => {
    if (!newStorageLocation || newStorageLocation === storageLocation) {
      setShowStorageLocationModal(false);
      return;
    }

    if (!storageLocationValidation.isValid) {
      showMessage("error", "Please fix the validation errors before saving");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/storage/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({ location: newStorageLocation.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update storage location");
      }

      const result = await response.json();
      setStorageLocation(result.location);
      setShowStorageLocationModal(false);
      showMessage("success", "Storage location updated successfully");

      // Refresh disk usage after changing location
      await loadStorageInfo();
    } catch (error) {
      console.error("Error updating storage location:", error);
      showMessage(
        "error",
        error.message || "Failed to update storage location"
      );
    } finally {
      setLoading(false);
    }
  };

  const openStorageLocationModal = () => {
    setNewStorageLocation(storageLocation);
    setStorageLocationValidation({
      isValid: true,
      message: "",
      isValidating: false,
    });
    setShowStorageLocationModal(true);
  };

  const closeStorageLocationModal = () => {
    setShowStorageLocationModal(false);
    setNewStorageLocation("");
    setStorageLocationValidation({
      isValid: true,
      message: "",
      isValidating: false,
    });
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

  // Backup System Functions
  const loadBackupConfig = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/backup-config`, {
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });

      if (response.ok) {
        const config = await response.json();
        setBackupConfig(config);
      }
    } catch (error) {
      console.error("Error loading backup config:", error);
      // Use default config if loading fails
    }
  };

  const updateBackupConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/backup-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify(backupConfig),
      });

      if (!response.ok) throw new Error("Failed to update backup config");

      const updatedConfig = await response.json();
      setBackupConfig(updatedConfig);
      showMessage("success", "Backup configuration updated successfully");
    } catch (error) {
      console.error("Error updating backup config:", error);
      showMessage("error", "Failed to update backup configuration");
    } finally {
      setLoading(false);
    }
  };

  const createUserBackup = async (userId, backupType) => {
    if (
      !backupConfig.enableAutoBackup ||
      !backupConfig.backupBeforeDestruction
    ) {
      return { success: true, message: "Backup disabled" };
    }

    setBackupStatus((prev) => ({ ...prev, isCreating: true }));

    try {
      const response = await fetch(`${backendUrl}/api/admin/backup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          userId,
          backupType,
          maxBackups: backupConfig.maxBackupsPerUser,
          location: backupConfig.backupLocation,
        }),
      });

      if (!response.ok) throw new Error("Failed to create backup");

      const backup = await response.json();
      setBackupStatus((prev) => ({
        ...prev,
        isCreating: false,
        lastBackupTime: new Date(),
        backupCount: prev.backupCount + 1,
      }));

      return { success: true, backup };
    } catch (error) {
      console.error("Error creating backup:", error);
      setBackupStatus((prev) => ({ ...prev, isCreating: false }));
      return { success: false, error: error.message };
    }
  };

  const getBackupHistory = async (userId) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/backup-history/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${user.id}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to get backup history");

      return await response.json();
    } catch (error) {
      console.error("Error getting backup history:", error);
      return [];
    }
  };

  // User Operations Functions
  const handleUserSelection = (userId) => {
    setSelectedUserId(userId);
    const user = users.find((u) => u.id === userId);
    setSelectedUser(user);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const showConfirmationModal = (
    title,
    message,
    confirmText,
    onConfirm,
    requiresTyping = false
  ) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm,
      requiresTyping,
    });
    setConfirmTypedText("");
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      title: "",
      message: "",
      confirmText: "",
      onConfirm: null,
      requiresTyping: false,
    });
    setConfirmTypedText("");
  };

  const executeConfirmedAction = () => {
    if (confirmationModal.requiresTyping && confirmTypedText !== "DELETE") {
      showMessage("error", 'Please type "DELETE" to confirm');
      return;
    }

    if (confirmationModal.onConfirm) {
      confirmationModal.onConfirm();
    }
    closeConfirmationModal();
  };

  // User Operations Actions - These will be implemented in subsequent tasks
  const clearUnknownTags = async () => {
    if (!selectedUserId) return;

    const backupMessage =
      backupConfig.enableAutoBackup && backupConfig.backupBeforeDestruction
        ? " A backup will be created before this operation."
        : "";

    showConfirmationModal(
      "Clear Unknown Tags",
      `This will remove all unknown/UUID tags from ${selectedUser?.name}'s notes. This action cannot be undone.${backupMessage}`,
      "Clear Tags",
      async () => {
        setLoading(true);
        try {
          // Create backup if enabled
          if (
            backupConfig.enableAutoBackup &&
            backupConfig.backupBeforeDestruction
          ) {
            showMessage("info", "Creating backup before clearing tags...");
            const backupResult = await createUserBackup(selectedUserId, "tags");

            if (!backupResult.success) {
              showMessage(
                "error",
                `Backup failed: ${backupResult.error}. Operation cancelled.`
              );
              return;
            }

            showMessage(
              "success",
              "Backup created successfully. Proceeding with tag clearing..."
            );
          }

          // Call the existing API endpoint to clear unknown tags
          const response = await fetch(
            `${backendUrl}/api/admin/users/${selectedUserId}/clear-unknown-tags`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.id}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to clear unknown tags");
          }

          const result = await response.json();
          showMessage(
            "success",
            result.message || "Unknown tags cleared successfully"
          );
        } catch (error) {
          showMessage("error", "Failed to clear unknown tags");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const deleteAllNotes = async () => {
    if (!selectedUserId) return;

    const backupMessage =
      backupConfig.enableAutoBackup && backupConfig.backupBeforeDestruction
        ? " A backup will be created before this operation."
        : "";

    showConfirmationModal(
      "Delete All Notes",
      `This will permanently delete ALL notes for ${selectedUser?.name}. This action cannot be undone.${backupMessage}`,
      "Delete Notes",
      async () => {
        setLoading(true);
        try {
          // Create backup if enabled
          if (
            backupConfig.enableAutoBackup &&
            backupConfig.backupBeforeDestruction
          ) {
            showMessage("info", "Creating backup before deleting notes...");
            const backupResult = await createUserBackup(
              selectedUserId,
              "notes"
            );

            if (!backupResult.success) {
              showMessage(
                "error",
                `Backup failed: ${backupResult.error}. Operation cancelled.`
              );
              return;
            }

            showMessage(
              "success",
              "Backup created successfully. Proceeding with note deletion..."
            );
          }

          // Call the new API endpoint to delete all notes
          const response = await fetch(
            `${backendUrl}/api/admin/users/${selectedUserId}/delete-all-notes`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.id}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete all notes");
          }

          const result = await response.json();
          showMessage(
            "success",
            result.message || "All notes deleted successfully"
          );
        } catch (error) {
          showMessage("error", "Failed to delete notes");
        } finally {
          setLoading(false);
        }
      },
      true // Requires typing "DELETE"
    );
  };

  const deleteAllAttachments = async () => {
    if (!selectedUserId) return;

    const backupMessage =
      backupConfig.enableAutoBackup && backupConfig.backupBeforeDestruction
        ? " A backup will be created before this operation."
        : "";

    showConfirmationModal(
      "Delete All Attachments",
      `This will permanently delete ALL attachments for ${selectedUser?.name}. This action cannot be undone.${backupMessage}`,
      "Delete Attachments",
      async () => {
        setLoading(true);
        try {
          // Create backup if enabled
          if (
            backupConfig.enableAutoBackup &&
            backupConfig.backupBeforeDestruction
          ) {
            showMessage(
              "info",
              "Creating backup before deleting attachments..."
            );
            const backupResult = await createUserBackup(
              selectedUserId,
              "attachments"
            );

            if (!backupResult.success) {
              showMessage(
                "error",
                `Backup failed: ${backupResult.error}. Operation cancelled.`
              );
              return;
            }

            showMessage(
              "success",
              "Backup created successfully. Proceeding with attachment deletion..."
            );
          }

          // Call the new API endpoint to delete all attachments
          const response = await fetch(
            `${backendUrl}/api/admin/users/${selectedUserId}/delete-all-attachments`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.id}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Failed to delete all attachments"
            );
          }

          const result = await response.json();
          showMessage(
            "success",
            result.message || "All attachments deleted successfully"
          );
        } catch (error) {
          showMessage("error", "Failed to delete attachments");
        } finally {
          setLoading(false);
        }
      },
      true // Requires typing "DELETE"
    );
  };

  const resetUserOTP = async () => {
    if (!selectedUserId) return;

    showConfirmationModal(
      "Reset OTP",
      `This will generate a new OTP secret and backup codes for ${selectedUser?.name}. The user will need to reconfigure their authenticator app.`,
      "Reset OTP",
      async () => {
        setLoading(true);
        try {
          // Call the OTP reset endpoint
          const response = await fetch(
            `${backendUrl}/api/admin/users/${selectedUserId}/reset-otp`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.id}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to reset OTP");
          }

          const result = await response.json();
          showMessage(
            "success",
            `${result.message}. New backup codes generated.`
          );
        } catch (error) {
          showMessage("error", `Failed to reset OTP: ${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Access History Functions
  const loadAccessHistory = async (userId, offset = 0, limit = 50) => {
    if (!userId) return;

    setAccessHistoryLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/users/${userId}/access-history?offset=${offset}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.id}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load access history");
      }

      const result = await response.json();

      if (offset === 0) {
        // First load - replace the history
        setAccessHistory(result.history);
      } else {
        // Load more - append to existing history
        setAccessHistory((prev) => [...prev, ...result.history]);
      }

      setAccessHistoryPagination({
        limit: result.limit,
        offset: result.offset,
        total: result.total,
        hasMore: result.hasMore,
      });
    } catch (error) {
      showMessage("error", `Failed to load access history: ${error.message}`);
    } finally {
      setAccessHistoryLoading(false);
    }
  };

  const toggleAccessHistory = async () => {
    if (!selectedUserId) return;

    if (!showAccessHistory) {
      // Loading history for first time
      await loadAccessHistory(selectedUserId);
    }

    setShowAccessHistory(!showAccessHistory);
  };

  const loadMoreAccessHistory = async () => {
    if (!selectedUserId || !accessHistoryPagination.hasMore) return;

    const nextOffset =
      accessHistoryPagination.offset + accessHistoryPagination.limit;
    await loadAccessHistory(selectedUserId, nextOffset);
  };

  const formatAccessHistoryEvent = (event) => {
    const date = new Date(event.timestamp);
    const timeString = date.toLocaleString();

    let description = "";
    let icon = <History size={16} />;
    let colorClass = "text-gray-600";

    switch (event.eventType) {
      case "login":
        icon = <User size={16} />;
        colorClass = event.success ? "text-green-600" : "text-red-600";
        if (event.success) {
          description = "Successful login";
        } else {
          const reason = event.details?.reason || "unknown";
          description = `Failed login attempt (${reason})`;
        }
        break;
      case "logout":
        icon = <User size={16} />;
        colorClass = "text-blue-600";
        description = "User logged out";
        break;
      case "password_change":
        icon = <Lock size={16} />;
        colorClass = "text-orange-600";
        description = "Password changed";
        break;
      case "otp_enable":
        icon = <Shield size={16} />;
        colorClass = "text-green-600";
        description = `OTP enabled by admin: ${
          event.details?.adminEmail || "unknown"
        }`;
        break;
      case "otp_disable":
        icon = <Shield size={16} />;
        colorClass = "text-red-600";
        description = `OTP disabled by admin: ${
          event.details?.adminEmail || "unknown"
        }`;
        break;
      case "otp_reset":
        icon = <RotateCcw size={16} />;
        colorClass = "text-orange-600";
        description = `OTP reset by admin: ${
          event.details?.adminEmail || "unknown"
        }`;
        break;
      case "admin_action":
        icon = <UserCog size={16} />;
        colorClass = "text-purple-600";
        const action = event.details?.action || "unknown";
        const adminEmail = event.details?.adminEmail || "unknown";
        description = `Admin action: ${action} by ${adminEmail}`;
        break;
      default:
        description = event.eventType;
    }

    return {
      timeString,
      description,
      icon,
      colorClass,
      ipAddress: event.ipAddress || "unknown",
      userAgent: event.userAgent || "unknown",
      details: event.details || {},
      success: event.success,
    };
  };

  // Bulk Operations Function
  const executeBulkOperations = async () => {
    if (!selectedUserId || !selectedUser) {
      showMessage("error", "Please select a user first");
      return;
    }

    const selectedOps = Object.entries(bulkOperations)
      .filter(([_, selected]) => selected)
      .map(([operation, _]) => operation);

    if (selectedOps.length === 0) {
      showMessage("error", "Please select at least one operation");
      return;
    }

    // Build confirmation message
    const operationNames = {
      clearUnknownTags: "Clear Unknown Tags",
      deleteAllNotes: "Delete All Notes",
      deleteAllAttachments: "Delete All Attachments",
      resetOTP: "Reset OTP Settings",
    };

    const operationsList = selectedOps
      .map((op) => `• ${operationNames[op]}`)
      .join("\n");
    const backupMessage =
      backupConfig.enableAutoBackup && backupConfig.backupBeforeDestruction
        ? " A backup will be created before these operations."
        : "";

    showConfirmationModal(
      "Execute Bulk Operations",
      `This will perform the following operations on ${selectedUser.name}:\n\n${operationsList}\n\nThis action cannot be undone.${backupMessage}`,
      "Execute Operations",
      async () => {
        setLoading(true);
        const results = [];

        try {
          // Create backup if enabled
          if (
            backupConfig.enableAutoBackup &&
            backupConfig.backupBeforeDestruction
          ) {
            showMessage(
              "info",
              "Creating backup before executing operations..."
            );
            const backupResult = await createUserBackup(selectedUserId, "bulk");

            if (!backupResult.success) {
              showMessage(
                "error",
                `Backup failed: ${backupResult.error}. Operations cancelled.`
              );
              return;
            }

            showMessage(
              "success",
              "Backup created successfully. Proceeding with operations..."
            );
          }

          // Execute operations in sequence
          for (const operation of selectedOps) {
            try {
              switch (operation) {
                case "clearUnknownTags":
                  showMessage("info", "Clearing unknown tags...");
                  const clearResponse = await fetch(
                    `${backendUrl}/api/admin/users/${selectedUserId}/clear-unknown-tags`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user.id}`,
                      },
                    }
                  );

                  if (!clearResponse.ok) {
                    const errorData = await clearResponse.json();
                    throw new Error(
                      errorData.error || "Failed to clear unknown tags"
                    );
                  }

                  const clearResult = await clearResponse.json();
                  results.push(`✓ ${clearResult.message}`);
                  break;

                case "deleteAllNotes":
                  showMessage("info", "Deleting all notes...");
                  const deleteNotesResponse = await fetch(
                    `${backendUrl}/api/admin/users/${selectedUserId}/delete-all-notes`,
                    {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user.id}`,
                      },
                    }
                  );

                  if (!deleteNotesResponse.ok) {
                    const errorData = await deleteNotesResponse.json();
                    throw new Error(
                      errorData.error || "Failed to delete all notes"
                    );
                  }

                  const deleteNotesResult = await deleteNotesResponse.json();
                  results.push(`✓ ${deleteNotesResult.message}`);
                  break;

                case "deleteAllAttachments":
                  showMessage("info", "Deleting all attachments...");
                  const deleteAttachmentsResponse = await fetch(
                    `${backendUrl}/api/admin/users/${selectedUserId}/delete-all-attachments`,
                    {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user.id}`,
                      },
                    }
                  );

                  if (!deleteAttachmentsResponse.ok) {
                    const errorData = await deleteAttachmentsResponse.json();
                    throw new Error(
                      errorData.error || "Failed to delete all attachments"
                    );
                  }

                  const deleteAttachmentsResult =
                    await deleteAttachmentsResponse.json();
                  results.push(`✓ ${deleteAttachmentsResult.message}`);
                  break;

                case "resetOTP":
                  showMessage("info", "Resetting OTP...");
                  const resetOTPResponse = await fetch(
                    `${backendUrl}/api/admin/users/${selectedUserId}/reset-otp`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user.id}`,
                      },
                    }
                  );

                  if (!resetOTPResponse.ok) {
                    const errorData = await resetOTPResponse.json();
                    throw new Error(errorData.error || "Failed to reset OTP");
                  }

                  const resetOTPResult = await resetOTPResponse.json();
                  results.push(`✓ ${resetOTPResult.message}`);
                  break;

                default:
                  results.push(`⚠️ Unknown operation: ${operation}`);
              }
            } catch (operationError) {
              results.push(
                `❌ Failed: ${operationNames[operation]} - ${operationError.message}`
              );
            }
          }

          // Show final results
          const successCount = results.filter((r) => r.startsWith("✓")).length;
          const failCount = results.filter((r) => r.startsWith("❌")).length;

          if (failCount === 0) {
            showMessage(
              "success",
              `All ${successCount} operations completed successfully!`
            );
          } else {
            showMessage(
              "error",
              `${successCount} operations succeeded, ${failCount} failed. Check console for details.`
            );
          }

          console.log("Bulk operations results:", results);

          // Clear selections
          setBulkOperations({
            clearUnknownTags: false,
            deleteAllNotes: false,
            deleteAllAttachments: false,
            resetOTP: false,
          });
        } catch (error) {
          showMessage("error", `Bulk operations failed: ${error.message}`);
          console.error("Bulk operations error:", error);
        } finally {
          setLoading(false);
        }
      },
      true // Require typing DELETE
    );
  };

  // Complete User Data Wipe Function
  const deleteAllUserData = async () => {
    if (!selectedUserId || !selectedUser) {
      showMessage("error", "Please select a user first");
      return;
    }

    // Prevent admin from deleting their own account
    if (selectedUserId === user.id) {
      showMessage("error", "You cannot delete your own admin account");
      return;
    }

    const backupMessage =
      backupConfig.enableAutoBackup && backupConfig.backupBeforeDestruction
        ? " A backup will be created before this operation."
        : "";

    showConfirmationModal(
      "⚠️ COMPLETE USER DATA WIPE",
      `This will permanently delete EVERYTHING for ${selectedUser.name}:\n\n• All notes and content\n• All file attachments\n• OTP/2FA settings\n• Access history\n• User account itself\n\nThe user will be completely removed from the system.${backupMessage}\n\nThis action cannot be undone.`,
      "WIPE ALL DATA",
      async () => {
        setLoading(true);

        try {
          // Create backup if enabled
          if (
            backupConfig.enableAutoBackup &&
            backupConfig.backupBeforeDestruction
          ) {
            showMessage("info", "Creating backup before complete wipe...");
            const backupResult = await createUserBackup(
              selectedUserId,
              "complete-wipe"
            );

            if (!backupResult.success) {
              showMessage(
                "error",
                `Backup failed: ${backupResult.error}. Operation cancelled.`
              );
              return;
            }

            showMessage(
              "success",
              "Backup created successfully. Proceeding with complete wipe..."
            );
          }

          // Perform complete user data wipe
          showMessage("info", "Performing complete user data wipe...");
          const response = await fetch(
            `${backendUrl}/api/admin/users/${selectedUserId}/delete-all-data`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.id}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Failed to perform complete user data wipe"
            );
          }

          const result = await response.json();

          // Show detailed results
          const results = result.results;
          const errors = results.errors || [];

          if (errors.length === 0) {
            showMessage(
              "success",
              `Complete user data wipe completed successfully!\n\n` +
                `• ${results.notesDeleted} notes deleted\n` +
                `• ${results.attachmentsDeleted} attachments deleted\n` +
                `• ${results.sizeFreeFormatted} of space freed\n` +
                `• OTP settings cleared: ${
                  results.otpCleared ? "Yes" : "No"
                }\n` +
                `• Access history cleared: ${
                  results.accessHistoryCleared ? "Yes" : "No"
                }\n` +
                `• User account deleted: ${results.userDeleted ? "Yes" : "No"}`
            );
          } else {
            showMessage(
              "error",
              `User data wipe completed with some errors:\n\n` +
                `Errors:\n${errors.map((e) => `• ${e}`).join("\n")}`
            );
          }

          console.log("Complete user data wipe results:", results);

          // Clear selection since user no longer exists
          setSelectedUserId("");
          setSelectedUser(null);

          // Refresh user list
          await loadUsers();

          // Refresh storage info
          await loadStorageInfo();
        } catch (error) {
          showMessage(
            "error",
            `Complete user data wipe failed: ${error.message}`
          );
          console.error("Complete user data wipe error:", error);
        } finally {
          setLoading(false);
        }
      },
      true // Require typing DELETE
    );
  };

  const sections = [
    { id: "users", label: "User Administration", icon: Users },
    { id: "operations", label: "User Operations", icon: UserCog },
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

          {activeSection === "operations" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                User Operations
              </h3>
              <p className="text-sm text-gray-600">
                Manage user data, reset accounts, and perform administrative
                operations.
              </p>

              {/* User Selection Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-4">
                  Select User for Operations
                </h4>

                {/* User Search */}
                <div className="relative mb-4">
                  <Search
                    size={16}
                    className="absolute left-3 top-3 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* User Selection Dropdown */}
                <div className="mb-4">
                  <select
                    value={selectedUserId}
                    onChange={(e) => handleUserSelection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a user...</option>
                    {filteredUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email}) -{" "}
                        {user.isAdmin ? "Admin" : "User"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected User Info */}
                {selectedUser && (
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <User size={20} className="text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedUser.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedUser.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedUser.isAdmin
                            ? "Administrator"
                            : "Standard User"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Operations Section */}
              {selectedUser && (
                <div className="space-y-6">
                  {/* Individual Operations */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Individual Operations
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={clearUnknownTags}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                      >
                        <Archive size={16} />
                        <span>Clear Unknown Tags</span>
                      </button>

                      <button
                        onClick={resetUserOTP}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Key size={16} />
                        <span>Reset OTP</span>
                      </button>

                      <button
                        onClick={deleteAllNotes}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <FileX size={16} />
                        <span>Delete All Notes</span>
                      </button>

                      <button
                        onClick={deleteAllAttachments}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        <span>Delete All Attachments</span>
                      </button>
                    </div>
                  </div>

                  {/* Access History */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Access History
                    </h4>
                    <button
                      onClick={toggleAccessHistory}
                      disabled={loading || !selectedUserId}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      <History size={16} />
                      <span>
                        {showAccessHistory ? "Hide" : "View"} Access History
                      </span>
                    </button>
                    <p className="text-sm text-gray-600 mt-2">
                      View login history, password changes, and security events.
                    </p>

                    {/* Access History Display */}
                    {showAccessHistory && (
                      <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">
                            Security Events for {selectedUser?.name}
                          </h5>
                          <div className="text-sm text-gray-600">
                            {accessHistoryPagination.total} total events
                          </div>
                        </div>

                        {accessHistoryLoading && accessHistory.length === 0 ? (
                          <div className="flex items-center justify-center py-8">
                            <RefreshCw
                              className="animate-spin mr-2"
                              size={20}
                            />
                            Loading access history...
                          </div>
                        ) : accessHistory.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No access history found for this user.
                          </div>
                        ) : (
                          <div className="max-h-96 overflow-y-auto space-y-2">
                            {accessHistory.map((event) => {
                              const formatted = formatAccessHistoryEvent(event);
                              return (
                                <div
                                  key={event.id}
                                  className="bg-white p-3 rounded border border-gray-200 hover:bg-gray-50"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className={formatted.colorClass}>
                                        {formatted.icon}
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {formatted.description}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {formatted.timeString}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {formatted.ipAddress}
                                    </div>
                                  </div>
                                  {formatted.userAgent !== "unknown" && (
                                    <div className="text-xs text-gray-400 mt-2 truncate">
                                      {formatted.userAgent}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Load More Button */}
                            {accessHistoryPagination.hasMore && (
                              <div className="flex justify-center pt-4">
                                <button
                                  onClick={loadMoreAccessHistory}
                                  disabled={accessHistoryLoading}
                                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {accessHistoryLoading ? (
                                    <RefreshCw
                                      className="animate-spin"
                                      size={16}
                                    />
                                  ) : (
                                    <History size={16} />
                                  )}
                                  <span>
                                    {accessHistoryLoading
                                      ? "Loading..."
                                      : "Load More"}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bulk Operations */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-900 mb-4">
                      ⚠️ Destructive Operations
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="bulkClearTags"
                          checked={bulkOperations.clearUnknownTags}
                          onChange={(e) =>
                            setBulkOperations((prev) => ({
                              ...prev,
                              clearUnknownTags: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <label
                          htmlFor="bulkClearTags"
                          className="text-sm text-gray-700"
                        >
                          Clear unknown tags
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="bulkDeleteNotes"
                          checked={bulkOperations.deleteAllNotes}
                          onChange={(e) =>
                            setBulkOperations((prev) => ({
                              ...prev,
                              deleteAllNotes: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <label
                          htmlFor="bulkDeleteNotes"
                          className="text-sm text-gray-700"
                        >
                          Delete all notes
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="bulkDeleteAttachments"
                          checked={bulkOperations.deleteAllAttachments}
                          onChange={(e) =>
                            setBulkOperations((prev) => ({
                              ...prev,
                              deleteAllAttachments: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <label
                          htmlFor="bulkDeleteAttachments"
                          className="text-sm text-gray-700"
                        >
                          Delete all attachments
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="bulkResetOTP"
                          checked={bulkOperations.resetOTP}
                          onChange={(e) =>
                            setBulkOperations((prev) => ({
                              ...prev,
                              resetOTP: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <label
                          htmlFor="bulkResetOTP"
                          className="text-sm text-gray-700"
                        >
                          Reset OTP settings
                        </label>
                      </div>

                      <div className="mt-4 pt-4 border-t border-red-200">
                        <button
                          onClick={executeBulkOperations}
                          disabled={
                            loading ||
                            !Object.values(bulkOperations).some(Boolean)
                          }
                          className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                        >
                          Execute Selected Operations
                        </button>
                        <p className="text-xs text-red-700 mt-2">
                          This will perform all selected operations
                          simultaneously. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Complete User Data Wipe */}
                  <div className="bg-red-100 p-4 rounded-lg border border-red-300 mt-6">
                    <h4 className="font-medium text-red-900 mb-4">
                      🚨 Complete User Data Wipe
                    </h4>
                    <p className="text-sm text-red-800 mb-4">
                      This will permanently delete <strong>EVERYTHING</strong>{" "}
                      for this user: all notes, attachments, OTP settings,
                      access history, and the user account itself.
                    </p>
                    <div className="space-y-2 text-sm text-red-700 mb-4">
                      <div>✓ Delete all notes and content</div>
                      <div>✓ Delete all file attachments</div>
                      <div>✓ Clear OTP/2FA settings</div>
                      <div>✓ Clear access history</div>
                      <div>✓ Delete user account</div>
                    </div>
                    <button
                      onClick={deleteAllUserData}
                      disabled={loading || !selectedUserId}
                      className="w-full px-4 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 font-medium"
                    >
                      Complete User Data Wipe
                    </button>
                    <p className="text-xs text-red-800 mt-2">
                      <strong>WARNING:</strong> This action cannot be undone.
                      The user will be completely removed from the system.
                    </p>
                  </div>
                </div>
              )}
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
                    onClick={openStorageLocationModal}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Settings size={16} />
                    <span>Change</span>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Current notes storage location. Can be set to any directory
                  outside the application.
                </p>
              </div>

              {/* Disk Usage */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">
                    Disk Usage by User
                  </h4>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {diskUsage.lastRefreshed && (
                        <span>
                          Last refreshed:{" "}
                          {new Date(diskUsage.lastRefreshed).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={loadStorageInfo}
                      disabled={loading}
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      <RefreshCw size={14} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* System Totals */}
                {diskUsage.systemTotals &&
                  Object.keys(diskUsage.systemTotals).length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-2">
                        System Totals
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {diskUsage.systemTotals.totalUsers || 0}
                          </div>
                          <div className="text-sm text-gray-600">Users</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {diskUsage.systemTotals.totalNotes || 0}
                          </div>
                          <div className="text-sm text-gray-600">Notes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {diskUsage.systemTotals.totalAttachments || 0}
                          </div>
                          <div className="text-sm text-gray-600">
                            Attachments
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {diskUsage.systemTotals.totalSize || "0 B"}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Size
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                          Notes Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attachments
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attachments Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {diskUsage.users.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            No users found or data loading...
                          </td>
                        </tr>
                      ) : (
                        diskUsage.users.map((usage) => (
                          <tr key={usage.userId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {usage.userName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {usage.userEmail}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {usage.noteCount} notes
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {usage.notesSize}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {usage.attachmentCount} files
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {usage.attachmentsSize}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {usage.totalSize}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {usage.lastUpdated
                                ? new Date(usage.lastUpdated).toLocaleString()
                                : "Never"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Backup Configuration */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-4">
                  Backup Configuration
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="enableAutoBackup"
                      checked={backupConfig.enableAutoBackup}
                      onChange={(e) =>
                        setBackupConfig((prev) => ({
                          ...prev,
                          enableAutoBackup: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="enableAutoBackup"
                      className="text-sm text-gray-700"
                    >
                      Enable automatic backup system
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="backupBeforeDestruction"
                      checked={backupConfig.backupBeforeDestruction}
                      onChange={(e) =>
                        setBackupConfig((prev) => ({
                          ...prev,
                          backupBeforeDestruction: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="backupBeforeDestruction"
                      className="text-sm text-gray-700"
                    >
                      Create backup before destructive operations
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Backups Per User
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={backupConfig.maxBackupsPerUser}
                        onChange={(e) =>
                          setBackupConfig((prev) => ({
                            ...prev,
                            maxBackupsPerUser: parseInt(e.target.value) || 10,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Older backups will be deleted when limit is reached
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Backup Location
                      </label>
                      <input
                        type="text"
                        value={backupConfig.backupLocation}
                        onChange={(e) =>
                          setBackupConfig((prev) => ({
                            ...prev,
                            backupLocation: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="backups"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Directory name for storing backups
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                    <div className="text-sm text-gray-600">
                      {backupStatus.isCreating ? (
                        <span className="text-blue-600">
                          Creating backup...
                        </span>
                      ) : backupStatus.lastBackupTime ? (
                        <span>
                          Last backup:{" "}
                          {backupStatus.lastBackupTime.toLocaleString()}
                        </span>
                      ) : (
                        <span>No backups created yet</span>
                      )}
                    </div>

                    <button
                      onClick={updateBackupConfig}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>Save Configuration</span>
                    </button>
                  </div>
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

        {/* Confirmation Modal */}
        {confirmationModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {confirmationModal.title}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {confirmationModal.message}
              </p>

              {confirmationModal.requiresTyping && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type "DELETE" to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmTypedText}
                    onChange={(e) => setConfirmTypedText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="DELETE"
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={executeConfirmedAction}
                  disabled={
                    confirmationModal.requiresTyping &&
                    confirmTypedText !== "DELETE"
                  }
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {confirmationModal.confirmText}
                </button>
                <button
                  onClick={closeConfirmationModal}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Storage Location Modal */}
        {showStorageLocationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-lg w-full mx-4 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Change Storage Location
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Set the directory where all user notes and attachments will be
                stored. This can be any directory on your system outside the
                application folder.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Directory Path
                  </label>
                  <input
                    type="text"
                    value={newStorageLocation}
                    onChange={(e) =>
                      handleStorageLocationChange(e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      storageLocationValidation.isValid
                        ? "border-gray-300 focus:ring-blue-500"
                        : "border-red-300 focus:ring-red-500"
                    }`}
                    placeholder="/path/to/storage/directory"
                  />

                  {/* Validation Message */}
                  {storageLocationValidation.isValidating && (
                    <div className="mt-2 flex items-center text-sm text-blue-600">
                      <RefreshCw className="animate-spin mr-2" size={16} />
                      Validating path...
                    </div>
                  )}

                  {!storageLocationValidation.isValidating &&
                    storageLocationValidation.message && (
                      <div
                        className={`mt-2 text-sm ${
                          storageLocationValidation.isValid
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {storageLocationValidation.isValid ? "✓" : "✗"}{" "}
                        {storageLocationValidation.message}
                      </div>
                    )}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-900 mb-2">
                    ⚠️ Important Notes:
                  </h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Path must be absolute (start with / or C:\\)</li>
                    <li>• Directory will be created if it doesn't exist</li>
                    <li>• Application must have read/write permissions</li>
                    <li>• Existing data will remain in current location</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Current Location:
                  </h4>
                  <code className="text-sm text-blue-800 bg-blue-100 px-2 py-1 rounded">
                    {storageLocation}
                  </code>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={updateStorageLocation}
                  disabled={
                    loading ||
                    !storageLocationValidation.isValid ||
                    storageLocationValidation.isValidating ||
                    newStorageLocation === storageLocation
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {loading ? "Updating..." : "Update Location"}
                </button>
                <button
                  onClick={closeStorageLocationModal}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmationModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {confirmationModal.title}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {confirmationModal.message}
              </p>

              {confirmationModal.requiresTyping && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type "DELETE" to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmTypedText}
                    onChange={(e) => setConfirmTypedText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="DELETE"
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={executeConfirmedAction}
                  disabled={
                    confirmationModal.requiresTyping &&
                    confirmTypedText !== "DELETE"
                  }
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {confirmationModal.confirmText}
                </button>
                <button
                  onClick={closeConfirmationModal}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInterface;
