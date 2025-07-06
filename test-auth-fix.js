#!/usr/bin/env node

console.log("🧪 Testing Authentication Fix");
console.log("=============================");

const baseUrl = "http://localhost:3004";

async function testAuth() {
  try {
    // Test 1: Login with existing demo user
    console.log("\n📝 Test 1: Login with demo user...");
    let response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "demo@example.com",
        password: "demo123"
      })
    });

    if (response.ok) {
      const user = await response.json();
      console.log("✅ Demo user login successful:", user.email, "(Admin:", user.isAdmin + ")");
    } else {
      const error = await response.json();
      console.log("❌ Demo user login failed:", error.error);
      return;
    }

    // Test 2: Login with admin user
    console.log("\n📝 Test 2: Login with admin user...");
    response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "admin123"
      })
    });

    if (response.ok) {
      const user = await response.json();
      console.log("✅ Admin user login successful:", user.email, "(Admin:", user.isAdmin + ")");
    } else {
      const error = await response.json();
      console.log("❌ Admin user login failed:", error.error);
      return;
    }

    // Test 3: Create a new user via admin API
    console.log("\n📝 Test 3: Creating a new test user...");
    response = await fetch(`${baseUrl}/api/admin/users`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer admin-1"  // Use admin user ID as Bearer token
      },
      body: JSON.stringify({
        name: "Test User Auth",
        email: "testauth@example.com",
        password: "testpass123",
        isAdmin: false
      })
    });

    let newUser;
    if (response.ok) {
      newUser = await response.json();
      console.log("✅ New user created:", newUser.email);
    } else {
      const error = await response.json();
      console.log("❌ User creation failed:", error.error);
      return;
    }

    // Test 4: Try to login with the newly created user
    console.log("\n📝 Test 4: Login with newly created user...");
    response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "testauth@example.com",
        password: "testpass123"
      })
    });

    if (response.ok) {
      const user = await response.json();
      console.log("✅ NEW USER LOGIN SUCCESSFUL:", user.email, "(Admin:", user.isAdmin + ")");
      console.log("🎉 AUTHENTICATION FIX WORKING!");
    } else {
      const error = await response.json();
      console.log("❌ New user login failed:", error.error);
    }

    // Test 5: Test invalid credentials
    console.log("\n📝 Test 5: Testing invalid credentials...");
    response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "wrongpass"
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.log("✅ Invalid credentials correctly rejected:", error.error);
    } else {
      console.log("❌ Invalid credentials were accepted (this is bad!)");
    }

  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run the test
testAuth().then(() => {
  console.log("\n🏁 Authentication test completed");
}).catch(error => {
  console.error("❌ Test script error:", error);
  process.exit(1);
});
