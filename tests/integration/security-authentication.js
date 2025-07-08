/**
 * Test Script: Security & Authentication Testing
 *
 * This script tests security features including session management, role-based access,
 * API authentication, password security, and CSRF protection.
 */

import configService from "../../src/configService.js";
import crypto from "crypto";

async function testSecurityAuthentication() {
  console.log("🔐 Testing Security & Authentication...\n");

  let backendUrl;
  try {
    backendUrl = await configService.getBackendUrl();
    console.log(`✅ Backend URL: ${backendUrl}`);
  } catch (error) {
    console.error("❌ Failed to get backend URL:", error);
    return;
  }

  const testData = {
    createdUsers: [],
    sessions: [],
    tokens: [],
  };

  // Performance tracking
  const performanceData = {
    authentication: [],
    authorization: [],
    sessionOps: [],
    passwordOps: [],
    securityChecks: [],
  };

  // Security findings
  const securityFindings = {
    vulnerabilities: [],
    warnings: [],
    recommendations: [],
  };

  try {
    // Test 1: Basic Authentication Flow
    console.log("🔑 Test 1: Basic Authentication Flow...");
    const startTime1 = Date.now();

    // Test invalid credentials
    const invalidLoginResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "wrongpassword",
      }),
    });

    if (invalidLoginResponse.status === 401) {
      console.log("✅ Invalid credentials correctly rejected");
    } else {
      console.log("❌ Invalid credentials should be rejected with 401");
      securityFindings.vulnerabilities.push(
        "Invalid credentials not properly rejected"
      );
    }

    // Test valid credentials
    const validLoginResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "demo@example.com",
        password: "demo123",
      }),
    });

    let authToken = null;
    if (validLoginResponse.ok) {
      const loginData = await validLoginResponse.json();
      authToken = loginData.token;
      console.log("✅ Valid credentials accepted");
      console.log(`   Token received: ${authToken ? "✅" : "❌"}`);
    } else {
      console.log("❌ Valid credentials should be accepted");
      securityFindings.vulnerabilities.push("Valid credentials rejected");
    }

    const duration1 = Date.now() - startTime1;
    performanceData.authentication.push(duration1);
    console.log(`✅ Authentication flow tested (${duration1}ms)`);

    // Test 2: Session Management and Expiration
    console.log("\n⏰ Test 2: Session Management and Expiration...");
    const startTime2 = Date.now();

    if (authToken) {
      // Test protected endpoint with valid token
      const protectedResponse = await fetch(`${backendUrl}/api/user-1/notes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (protectedResponse.ok) {
        console.log("✅ Valid token grants access to protected endpoint");
      } else {
        console.log("❌ Valid token should grant access");
        securityFindings.vulnerabilities.push(
          "Valid token rejected by protected endpoint"
        );
      }

      // Test with invalid token
      const invalidTokenResponse = await fetch(
        `${backendUrl}/api/user-1/notes`,
        {
          headers: { Authorization: "Bearer invalid-token" },
        }
      );

      if (invalidTokenResponse.status === 401) {
        console.log("✅ Invalid token correctly rejected");
      } else {
        console.log("❌ Invalid token should be rejected with 401");
        securityFindings.vulnerabilities.push(
          "Invalid token not properly rejected"
        );
      }

      // Test without authorization header
      const noAuthResponse = await fetch(`${backendUrl}/api/user-1/notes`);

      if (noAuthResponse.status === 401) {
        console.log("✅ Missing authorization correctly rejected");
      } else {
        console.log("❌ Missing authorization should be rejected");
        securityFindings.vulnerabilities.push(
          "Missing authorization not enforced"
        );
      }
    }

    const duration2 = Date.now() - startTime2;
    performanceData.sessionOps.push(duration2);
    console.log(`✅ Session management tested (${duration2}ms)`);

    // Test 3: Role-based Access Control
    console.log("\n👥 Test 3: Role-based Access Control...");
    const startTime3 = Date.now();

    // Test admin endpoints with regular user
    const regularUserAuth = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "demo@example.com",
        password: "demo123",
      }),
    });

    if (regularUserAuth.ok) {
      const userData = await regularUserAuth.json();
      const userToken = userData.token;

      // Try to access admin endpoint
      const adminAccessResponse = await fetch(`${backendUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      if (adminAccessResponse.status === 403) {
        console.log("✅ Regular user correctly denied admin access");
      } else {
        console.log("❌ Regular user should be denied admin access");
        securityFindings.vulnerabilities.push(
          "Admin access control bypass possible"
        );
      }
    }

    // Test admin endpoints with admin user
    const adminAuth = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "admin123",
      }),
    });

    if (adminAuth.ok) {
      const adminData = await adminAuth.json();
      const adminToken = adminData.token;

      const adminEndpointResponse = await fetch(
        `${backendUrl}/api/admin/users`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      if (adminEndpointResponse.ok) {
        console.log("✅ Admin user correctly granted admin access");
      } else {
        console.log("❌ Admin user should have admin access");
        securityFindings.vulnerabilities.push(
          "Admin access not working for admin users"
        );
      }
    } else {
      console.log(
        "⚠️  Admin credentials not available - skipping admin access test"
      );
    }

    const duration3 = Date.now() - startTime3;
    performanceData.authorization.push(duration3);
    console.log(`✅ Role-based access control tested (${duration3}ms)`);

    // Test 4: Password Security and Validation
    console.log("\n🔒 Test 4: Password Security and Validation...");
    const startTime4 = Date.now();

    // Test weak password creation
    const weakPasswords = ["123", "password", "abc", "111111", "qwerty"];

    for (const weakPassword of weakPasswords) {
      const weakPassResponse = await fetch(`${backendUrl}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer admin-1",
        },
        body: JSON.stringify({
          name: "Weak Password Test",
          email: `weak-${Date.now()}@example.com`,
          password: weakPassword,
          isAdmin: false,
        }),
      });

      if (!weakPassResponse.ok) {
        console.log(`✅ Weak password "${weakPassword}" correctly rejected`);
      } else {
        console.log(`❌ Weak password "${weakPassword}" should be rejected`);
        securityFindings.vulnerabilities.push(
          `Weak password "${weakPassword}" accepted`
        );

        // Clean up if created
        const userData = await weakPassResponse.json();
        testData.createdUsers.push(userData.id);
      }
    }

    // Test strong password
    const strongPassword = "SecureP@ssw0rd123!";
    const strongPassResponse = await fetch(`${backendUrl}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin-1",
      },
      body: JSON.stringify({
        name: "Strong Password Test",
        email: `strong-${Date.now()}@example.com`,
        password: strongPassword,
        isAdmin: false,
      }),
    });

    if (strongPassResponse.ok) {
      const userData = await strongPassResponse.json();
      testData.createdUsers.push(userData.id);
      console.log("✅ Strong password correctly accepted");
    } else {
      console.log("❌ Strong password should be accepted");
      securityFindings.warnings.push(
        "Strong password validation may be too strict"
      );
    }

    const duration4 = Date.now() - startTime4;
    performanceData.passwordOps.push(duration4);
    console.log(`✅ Password security tested (${duration4}ms)`);

    // Test 5: API Rate Limiting and DOS Protection
    console.log("\n🚦 Test 5: API Rate Limiting and DOS Protection...");
    const startTime5 = Date.now();

    // Rapid fire login attempts
    const rapidRequests = [];
    for (let i = 0; i < 20; i++) {
      rapidRequests.push(
        fetch(`${backendUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "testpassword",
          }),
        })
      );
    }

    const rapidResults = await Promise.allSettled(rapidRequests);

    let rateLimitedCount = 0;
    let successCount = 0;

    for (const result of rapidResults) {
      if (result.status === "fulfilled") {
        if (result.value.status === 429) {
          // Too Many Requests
          rateLimitedCount++;
        } else if (result.value.status === 401) {
          // Unauthorized (expected)
          successCount++;
        }
      }
    }

    if (rateLimitedCount > 0) {
      console.log(
        `✅ Rate limiting active - ${rateLimitedCount} requests limited`
      );
    } else {
      console.log("⚠️  No rate limiting detected - consider implementing");
      securityFindings.recommendations.push(
        "Implement API rate limiting to prevent DOS attacks"
      );
    }

    const duration5 = Date.now() - startTime5;
    performanceData.securityChecks.push(duration5);
    console.log(`✅ Rate limiting tested (${duration5}ms)`);

    // Test 6: SQL Injection Prevention
    console.log("\n💉 Test 6: SQL Injection Prevention...");
    const startTime6 = Date.now();

    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; DELETE FROM notes; --",
      "admin'--",
      "' UNION SELECT * FROM users --",
    ];

    for (const payload of sqlInjectionPayloads) {
      const injectionResponse = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payload,
          password: "testpassword",
        }),
      });

      if (
        injectionResponse.status === 401 ||
        injectionResponse.status === 400
      ) {
        console.log(
          `✅ SQL injection payload safely handled: "${payload.substring(
            0,
            20
          )}..."`
        );
      } else if (injectionResponse.ok) {
        console.log(`❌ CRITICAL: SQL injection possible with: "${payload}"`);
        securityFindings.vulnerabilities.push(
          `SQL injection vulnerability with payload: ${payload}`
        );
      }
    }

    const duration6 = Date.now() - startTime6;
    performanceData.securityChecks.push(duration6);
    console.log(`✅ SQL injection prevention tested (${duration6}ms)`);

    // Test 7: XSS Prevention
    console.log("\n🕸️  Test 7: XSS Prevention...");
    const startTime7 = Date.now();

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')">',
      "<svg onload=\"alert('XSS')\">",
    ];

    // Create a test note with XSS payload
    for (const payload of xssPayloads) {
      const xssResponse = await fetch(`${backendUrl}/api/user-1/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer user-1",
        },
        body: JSON.stringify({
          title: `XSS Test: ${payload}`,
          content: `Testing XSS: ${payload}`,
          tags: [],
        }),
      });

      if (xssResponse.ok) {
        const note = await xssResponse.json();
        testData.createdNotes = testData.createdNotes || [];
        testData.createdNotes.push(note.id);

        // Retrieve the note to see if payload is sanitized
        const retrieveResponse = await fetch(
          `${backendUrl}/api/user-1/notes/${note.id}`,
          {
            headers: { Authorization: "Bearer user-1" },
          }
        );

        if (retrieveResponse.ok) {
          const retrievedNote = await retrieveResponse.json();
          const content = JSON.stringify(retrievedNote);

          if (
            content.includes("<script>") ||
            content.includes("javascript:") ||
            content.includes("onerror=")
          ) {
            console.log(
              `❌ XSS payload not sanitized: "${payload.substring(0, 30)}..."`
            );
            securityFindings.vulnerabilities.push(
              `XSS vulnerability with payload: ${payload}`
            );
          } else {
            console.log(
              `✅ XSS payload safely sanitized: "${payload.substring(
                0,
                30
              )}..."`
            );
          }
        }
      }
    }

    const duration7 = Date.now() - startTime7;
    performanceData.securityChecks.push(duration7);
    console.log(`✅ XSS prevention tested (${duration7}ms)`);

    // Test 8: CSRF Protection
    console.log("\n🛡️  Test 8: CSRF Protection...");
    const startTime8 = Date.now();

    // Test if CSRF tokens are required for state-changing operations
    const csrfTestResponse = await fetch(`${backendUrl}/api/user-1/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer user-1",
        Origin: "http://malicious-site.com",
      },
      body: JSON.stringify({
        title: "CSRF Test Note",
        content: "Testing CSRF protection",
        tags: [],
      }),
    });

    // Check if request is blocked or requires CSRF token
    if (csrfTestResponse.status === 403) {
      console.log("✅ CSRF protection active - cross-origin request blocked");
    } else if (csrfTestResponse.ok) {
      console.log("⚠️  CSRF protection may be insufficient");
      securityFindings.recommendations.push(
        "Implement CSRF tokens for state-changing operations"
      );

      // Clean up created note
      const note = await csrfTestResponse.json();
      testData.createdNotes = testData.createdNotes || [];
      testData.createdNotes.push(note.id);
    }

    const duration8 = Date.now() - startTime8;
    performanceData.securityChecks.push(duration8);
    console.log(`✅ CSRF protection tested (${duration8}ms)`);

    // Test 9: Sensitive Data Exposure
    console.log("\n🔍 Test 9: Sensitive Data Exposure...");
    const startTime9 = Date.now();

    // Check if error messages expose sensitive information
    const sensitiveDataTests = [
      {
        endpoint: "/api/auth/login",
        data: { email: "test", password: "test" },
      },
      { endpoint: "/api/nonexistent", data: {} },
      { endpoint: "/api/user-1/notes/invalid-id", data: {} },
    ];

    for (const test of sensitiveDataTests) {
      const response = await fetch(`${backendUrl}${test.endpoint}`, {
        method: test.data ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: test.data ? JSON.stringify(test.data) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Check for sensitive information in error messages
        const sensitivePatterns = [
          /password/i,
          /database/i,
          /server/i,
          /stack trace/i,
          /file path/i,
          /connection string/i,
        ];

        let hasSensitiveInfo = false;
        for (const pattern of sensitivePatterns) {
          if (pattern.test(errorText)) {
            hasSensitiveInfo = true;
            break;
          }
        }

        if (hasSensitiveInfo) {
          console.log(`❌ Sensitive information in error for ${test.endpoint}`);
          securityFindings.vulnerabilities.push(
            `Sensitive data exposed in error: ${test.endpoint}`
          );
        } else {
          console.log(
            `✅ No sensitive information in error for ${test.endpoint}`
          );
        }
      }
    }

    const duration9 = Date.now() - startTime9;
    performanceData.securityChecks.push(duration9);
    console.log(`✅ Sensitive data exposure tested (${duration9}ms)`);

    // Test 10: Session Fixation and Hijacking
    console.log("\n🔐 Test 10: Session Security...");
    const startTime10 = Date.now();

    if (authToken) {
      // Test session invalidation on logout
      const logoutResponse = await fetch(`${backendUrl}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (logoutResponse.ok) {
        // Try to use the token after logout
        const postLogoutResponse = await fetch(
          `${backendUrl}/api/user-1/notes`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        if (postLogoutResponse.status === 401) {
          console.log("✅ Session correctly invalidated on logout");
        } else {
          console.log("❌ Session should be invalidated on logout");
          securityFindings.vulnerabilities.push(
            "Session not invalidated on logout"
          );
        }
      } else {
        console.log("⚠️  Logout endpoint not available or working");
        securityFindings.recommendations.push(
          "Implement proper logout with session invalidation"
        );
      }
    }

    const duration10 = Date.now() - startTime10;
    performanceData.securityChecks.push(duration10);
    console.log(`✅ Session security tested (${duration10}ms)`);

    console.log("\n📊 Performance Summary:");
    console.log("========================");
    console.log(
      `Authentication: ${performanceData.authentication.join("ms, ")}ms`
    );
    console.log(
      `Authorization: ${performanceData.authorization.join("ms, ")}ms`
    );
    console.log(
      `Session Operations: ${performanceData.sessionOps.join("ms, ")}ms`
    );
    console.log(
      `Password Operations: ${performanceData.passwordOps.join("ms, ")}ms`
    );
    console.log(
      `Security Checks: ${performanceData.securityChecks.join("ms, ")}ms`
    );

    const allOperations = [
      ...performanceData.authentication,
      ...performanceData.authorization,
      ...performanceData.sessionOps,
      ...performanceData.passwordOps,
      ...performanceData.securityChecks,
    ];

    if (allOperations.length > 0) {
      const avgPerformance =
        allOperations.reduce((a, b) => a + b, 0) / allOperations.length;
      console.log(`\nAverage Operation Time: ${avgPerformance.toFixed(2)}ms`);

      // Performance warnings
      const slowOperations = allOperations.filter((time) => time > 100);
      if (slowOperations.length > 0) {
        console.log(
          `⚠️  Performance warning: ${slowOperations.length} operations exceeded 100ms threshold`
        );
      }
    }

    console.log("\n🛡️  Security Assessment:");
    console.log("========================");
    console.log(
      `🚨 Vulnerabilities Found: ${securityFindings.vulnerabilities.length}`
    );
    console.log(`⚠️  Warnings: ${securityFindings.warnings.length}`);
    console.log(
      `💡 Recommendations: ${securityFindings.recommendations.length}`
    );

    if (securityFindings.vulnerabilities.length > 0) {
      console.log("\n🚨 VULNERABILITIES:");
      securityFindings.vulnerabilities.forEach((vuln, index) => {
        console.log(`   ${index + 1}. ${vuln}`);
      });
    }

    if (securityFindings.warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      securityFindings.warnings.forEach((warn, index) => {
        console.log(`   ${index + 1}. ${warn}`);
      });
    }

    if (securityFindings.recommendations.length > 0) {
      console.log("\n💡 RECOMMENDATIONS:");
      securityFindings.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    const totalFindings =
      securityFindings.vulnerabilities.length +
      securityFindings.warnings.length;
    if (totalFindings === 0) {
      console.log("\n🎉 No major security issues found!");
    } else if (securityFindings.vulnerabilities.length === 0) {
      console.log(
        "\n✅ No critical vulnerabilities found, but see warnings above"
      );
    } else {
      console.log(
        "\n❌ Critical security vulnerabilities found - immediate attention required!"
      );
    }

    console.log("\n🎉 Security & Authentication test completed!");
  } catch (error) {
    console.error("\n❌ Security & Authentication test failed:", error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up test data...");

    // Delete created users
    for (const userId of testData.createdUsers) {
      try {
        await fetch(`${backendUrl}/api/admin/users/${userId}`, {
          method: "DELETE",
          headers: { Authorization: "Bearer admin-1" },
        });
      } catch (error) {
        console.warn(`Failed to delete user ${userId}:`, error.message);
      }
    }

    // Delete created notes
    if (testData.createdNotes) {
      for (const noteId of testData.createdNotes) {
        try {
          await fetch(`${backendUrl}/api/user-1/notes/${noteId}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer user-1" },
          });
        } catch (error) {
          console.warn(`Failed to delete note ${noteId}:`, error.message);
        }
      }
    }

    console.log("✅ Cleanup completed");
  }
}

// Run the test
testSecurityAuthentication().catch(console.error);
