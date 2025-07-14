/**
 * Test Script: Admin Interface
 *
 * This script tests all admin interface functionality including:
 * - User management (add, disable, delete, reset password)
 * - Data management (storage location, disk usage)
 * - Admin authentication and access control
 */

import configService from "../../src/configService.js";

async function testAdminInterface() {
  console.log("🧪 Testing Admin Interface...\n");

  let backendUrl;
  try {
    backendUrl = await configService.getBackendUrl();
    console.log(`✅ Backend URL: ${backendUrl}`);
  } catch (error) {
    console.error("❌ Failed to get backend URL:", error);
    return;
  }

  const adminUserId = "admin-1"; // Admin user
  const regularUserId = "user-1"; // Regular user

  try {
    // Test 1: Admin Authentication
    console.log("🔐 Test 1: Admin Authentication...");

    // Test admin access
    const adminUsersResponse = await fetch(`${backendUrl}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${adminUserId}`,
      },
    });

    if (adminUsersResponse.ok) {
      console.log("  ✅ Admin authentication successful");
    } else {
      console.log("  ❌ Admin authentication failed");
      return;
    }

    // Test regular user access (should fail)
    const regularUserResponse = await fetch(`${backendUrl}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${regularUserId}`,
      },
    });

    if (regularUserResponse.status === 403) {
      console.log("  ✅ Regular user correctly denied admin access");
    } else {
      console.log("  ❌ Regular user access control failed");
    }

    // Test 2: Get All Users
    console.log("\n👥 Test 2: Get All Users...");
    const users = await adminUsersResponse.json();
    console.log(`  📊 Found ${users.length} users:`);

    for (const user of users) {
      console.log(
        `    - ${user.name} (${user.email}) - ${
          user.isAdmin ? "Admin" : "User"
        } - ${user.disabled ? "Disabled" : "Active"}`
      );
    }

    // Test 3: Create New User
    console.log("\n➕ Test 3: Create New User...");

    const newUserData = {
      name: "Test Admin User",
      email: `test-admin-${Date.now()}@example.com`,
      password: "testpass123",
      isAdmin: false,
    };

    const createUserResponse = await fetch(`${backendUrl}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminUserId}`,
      },
      body: JSON.stringify(newUserData),
    });

    if (createUserResponse.ok) {
      const createdUser = await createUserResponse.json();
      console.log(
        `  ✅ User created: ${createdUser.name} (${createdUser.email})`
      );

      // Test 4: Update User Information
      console.log("\n✏️ Test 4: Update User Information...");

      const updateUserResponse = await fetch(
        `${backendUrl}/api/admin/users/${createdUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminUserId}`,
          },
          body: JSON.stringify({
            name: "Updated Test User",
            isAdmin: true,
          }),
        }
      );

      if (updateUserResponse.ok) {
        const updatedUser = await updateUserResponse.json();
        console.log(
          `  ✅ User updated: ${updatedUser.name}, Admin: ${updatedUser.isAdmin}`
        );
      } else {
        console.log("  ❌ Failed to update user");
      }

      // Test 5: Reset Password
      console.log("\n🔄 Test 5: Reset Password...");

      const resetPasswordResponse = await fetch(
        `${backendUrl}/api/admin/users/${createdUser.id}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminUserId}`,
          },
          body: JSON.stringify({ newPassword: "newpass456" }),
        }
      );

      if (resetPasswordResponse.ok) {
        console.log("  ✅ Password reset successfully");
      } else {
        console.log("  ❌ Failed to reset password");
      }

      // Test 6: Disable User
      console.log("\n🚫 Test 6: Disable User...");

      const disableUserResponse = await fetch(
        `${backendUrl}/api/admin/users/${createdUser.id}/disable`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminUserId}`,
          },
        }
      );

      if (disableUserResponse.ok) {
        console.log("  ✅ User disabled successfully");
      } else {
        console.log("  ❌ Failed to disable user");
      }

      // Test 7: Enable User
      console.log("\n✅ Test 7: Enable User...");

      const enableUserResponse = await fetch(
        `${backendUrl}/api/admin/users/${createdUser.id}/enable`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminUserId}`,
          },
        }
      );

      if (enableUserResponse.ok) {
        console.log("  ✅ User enabled successfully");
      } else {
        console.log("  ❌ Failed to enable user");
      }

      // Test 8: Delete User (cleanup)
      console.log("\n🗑️ Test 8: Delete User...");

      const deleteUserResponse = await fetch(
        `${backendUrl}/api/admin/users/${createdUser.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminUserId}`,
          },
        }
      );

      if (deleteUserResponse.ok) {
        console.log("  ✅ User deleted successfully");
      } else {
        console.log("  ❌ Failed to delete user");
      }
    } else {
      console.log("  ❌ Failed to create user");
      const error = await createUserResponse.json();
      console.log(`    Error: ${error.error}`);
    }

    // Test 9: Storage Information
    console.log("\n💾 Test 9: Storage Information...");

    const storageResponse = await fetch(`${backendUrl}/api/admin/storage`, {
      headers: {
        Authorization: `Bearer ${adminUserId}`,
      },
    });

    if (storageResponse.ok) {
      const storageData = await storageResponse.json();
      console.log(`  📁 Storage location: ${storageData.location}`);
      console.log(`  📊 User storage usage:`);

      for (const usage of storageData.userUsage) {
        console.log(
          `    - ${usage.userName}: ${usage.noteCount} notes, ${usage.attachmentCount} attachments, ${usage.totalSize}`
        );
      }
    } else {
      console.log("  ❌ Failed to get storage information");
    }

    // Test 10: Clear Unknown Tags
    console.log("\n🏷️ Test 10: Clear Unknown Tags...");

    const clearTagsResponse = await fetch(
      `${backendUrl}/api/admin/users/${regularUserId}/clear-unknown-tags`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminUserId}`,
        },
      }
    );

    if (clearTagsResponse.ok) {
      const result = await clearTagsResponse.json();
      console.log(`  ✅ ${result.message}`);
    } else {
      console.log("  ❌ Failed to clear unknown tags");
    }

    // Test 11: Input Validation
    console.log("\n🛡️ Test 11: Input Validation...");

    // Test creating user with invalid data
    const invalidUserResponse = await fetch(`${backendUrl}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminUserId}`,
      },
      body: JSON.stringify({
        name: "",
        email: "invalid-email",
        password: "123", // Too short
      }),
    });

    if (invalidUserResponse.status === 400) {
      console.log("  ✅ Input validation working correctly");
    } else {
      console.log("  ❌ Input validation failed");
    }

    console.log("\n🎉 Admin Interface testing completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Validation functions (following established patterns)
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

function validateUserData(userData) {
  const errors = [];

  if (!userData.name || userData.name.trim().length === 0) {
    errors.push("Name is required");
  }

  if (!validateEmail(userData.email)) {
    errors.push("Valid email is required");
  }

  if (!validatePassword(userData.password)) {
    errors.push("Password must be at least 6 characters long");
  }

  return errors;
}

// Run the test
testAdminInterface().catch(console.error);
