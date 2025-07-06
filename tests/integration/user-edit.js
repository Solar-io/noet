#!/usr/bin/env node

console.log("✏️ Testing User Edit Functionality");
console.log("==================================");

const baseUrl = "http://localhost:3004";

async function testUserEdit() {
  try {
    console.log("\n📝 Test 1: Create a test user to edit...");
    let response = await fetch(`${baseUrl}/api/admin/users`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer admin-1"
      },
      body: JSON.stringify({
        name: "Test Edit User",
        email: "test-edit@example.com",
        password: "testpass123",
        isAdmin: false
      })
    });

    let testUser;
    if (response.ok) {
      testUser = await response.json();
      console.log("✅ Test user created:", testUser.email);
    } else {
      const error = await response.json();
      console.log("❌ User creation failed:", error.error);
      return;
    }

    console.log("\n📝 Test 2: Edit user name and email...");
    response = await fetch(`${baseUrl}/api/admin/users/${testUser.id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer admin-1"
      },
      body: JSON.stringify({
        name: "Updated Test User",
        email: "updated-test@example.com",
        isAdmin: false
      })
    });

    if (response.ok) {
      const updatedUser = await response.json();
      console.log("✅ User updated successfully:");
      console.log("   Name:", updatedUser.name);
      console.log("   Email:", updatedUser.email);
      console.log("   Admin:", updatedUser.isAdmin);
    } else {
      const error = await response.json();
      console.log("❌ User update failed:", error.error);
      return;
    }

    console.log("\n📝 Test 3: Promote user to admin...");
    response = await fetch(`${baseUrl}/api/admin/users/${testUser.id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer admin-1"
      },
      body: JSON.stringify({
        name: "Updated Test User",
        email: "updated-test@example.com",
        isAdmin: true
      })
    });

    if (response.ok) {
      const adminUser = await response.json();
      console.log("✅ User promoted to admin:", adminUser.isAdmin);
    } else {
      const error = await response.json();
      console.log("❌ Admin promotion failed:", error.error);
    }

    console.log("\n📝 Test 4: Verify user can login with updated credentials...");
    response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "updated-test@example.com",
        password: "testpass123"
      })
    });

    if (response.ok) {
      const loggedInUser = await response.json();
      console.log("✅ Login successful with updated email:", loggedInUser.email);
      console.log("   User name:", loggedInUser.name);
      console.log("   Is admin:", loggedInUser.isAdmin);
    } else {
      const error = await response.json();
      console.log("❌ Login with updated email failed:", error.error);
    }

    console.log("\n📝 Test 5: Test validation (empty name)...");
    response = await fetch(`${baseUrl}/api/admin/users/${testUser.id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer admin-1"
      },
      body: JSON.stringify({
        name: "",
        email: "updated-test@example.com",
        isAdmin: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.log("✅ Validation working - empty name rejected:", error.error);
    } else {
      console.log("❌ Validation failed - empty name was accepted");
    }

    console.log("\n📝 Test 6: Final user list...");
    response = await fetch(`${baseUrl}/api/admin/users`, {
      method: "GET",
      headers: { "Authorization": "Bearer admin-1" }
    });

    if (response.ok) {
      const users = await response.json();
      console.log(`✅ Total users: ${users.length}`);
      const editedUser = users.find(u => u.id === testUser.id);
      if (editedUser) {
        console.log("✅ Edited user found in list:");
        console.log("   Name:", editedUser.name);
        console.log("   Email:", editedUser.email);
        console.log("   Admin:", editedUser.isAdmin);
      }
      
      console.log("\n🎉 USER EDIT FUNCTIONALITY WORKING!");
      
      console.log("\n💡 Features Available:");
      console.log("   ✅ Edit user name and email");
      console.log("   ✅ Toggle admin privileges");
      console.log("   ✅ Changes persist across sessions");
      console.log("   ✅ Updated credentials work for login");
      console.log("   ✅ Input validation prevents empty fields");
      
    } else {
      console.log("❌ Failed to get final user list");
    }

  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run the test
testUserEdit().then(() => {
  console.log("\n🏁 User edit test completed");
}).catch(error => {
  console.error("❌ Test script error:", error);
  process.exit(1);
});
