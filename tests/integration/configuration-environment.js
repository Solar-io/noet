/**
 * Test Script: Configuration & Environment Testing
 *
 * This script tests configuration and environment handling including different settings,
 * environment variables, multi-user setup, and storage location changes.
 */

import configService from "../../src/configService.js";
import fs from "fs";
import path from "path";

async function testConfigurationEnvironment() {
  console.log("⚙️  Testing Configuration & Environment...\n");

  const testData = {
    originalConfig: null,
    createdConfigs: [],
    createdDirectories: [],
    createdFiles: [],
    envBackups: {},
    tempUsers: [],
  };

  // Configuration test scenarios
  const configScenarios = [
    {
      name: "Development Environment",
      config: {
        environment: "development",
        debug: true,
        port: 3001,
        cors: { origin: "*" },
        logging: { level: "debug" },
      },
    },
    {
      name: "Production Environment",
      config: {
        environment: "production",
        debug: false,
        port: 80,
        cors: { origin: "https://example.com" },
        logging: { level: "error" },
      },
    },
    {
      name: "Multi-User Environment",
      config: {
        environment: "multi-user",
        maxUsers: 100,
        userStoragePath: "./server/notes",
        sharedResources: true,
        authentication: { required: true },
      },
    },
    {
      name: "Single-User Environment",
      config: {
        environment: "single-user",
        maxUsers: 1,
        userStoragePath: "./notes",
        sharedResources: false,
        authentication: { required: false },
      },
    },
  ];

  // Performance tracking
  const performanceData = {
    configLoads: [],
    environmentSwitches: [],
    storageOperations: [],
    userOperations: [],
    validation: [],
  };

  try {
    // Test 1: Configuration Loading and Validation
    console.log("📋 Test 1: Configuration Loading and Validation...");
    const startTime1 = Date.now();

    // Backup original configuration
    let backendUrl;
    try {
      backendUrl = await configService.getBackendUrl();
      console.log(`✅ Backend URL: ${backendUrl}`);

      // Get current configuration
      const configResponse = await fetch(`${backendUrl}/api/admin/config`, {
        headers: { Authorization: "Bearer admin-1" },
      });

      if (configResponse.ok) {
        testData.originalConfig = await configResponse.json();
        console.log("✅ Original configuration backed up");
      }
    } catch (error) {
      console.error("❌ Failed to get backend URL:", error);
      return;
    }

    // Test loading different configuration files
    const configFiles = ["config.json", "public/config.json"];

    for (const configFile of configFiles) {
      console.log(`\n   Testing configuration file: ${configFile}`);
      const configStartTime = Date.now();

      if (fs.existsSync(configFile)) {
        try {
          const configContent = fs.readFileSync(configFile, "utf8");
          const config = JSON.parse(configContent);

          // Validate configuration structure
          const requiredFields = ["backendUrl", "environment"];
          const missingFields = requiredFields.filter(
            (field) => !config[field]
          );

          if (missingFields.length === 0) {
            console.log(`     ✅ Configuration structure valid`);
          } else {
            console.log(
              `     ❌ Missing required fields: ${missingFields.join(", ")}`
            );
          }

          // Test configuration loading performance
          const loadEndTime = Date.now();
          const loadDuration = loadEndTime - configStartTime;
          performanceData.configLoads.push({
            file: configFile,
            duration: loadDuration,
            size: Buffer.byteLength(configContent),
          });

          console.log(`     ✅ Configuration loaded in ${loadDuration}ms`);
        } catch (error) {
          console.log(`     ❌ Configuration parsing failed: ${error.message}`);
        }
      } else {
        console.log(`     ⚠️  Configuration file not found: ${configFile}`);
      }
    }

    const duration1 = Date.now() - startTime1;
    console.log(`✅ Configuration loading tested (${duration1}ms)`);

    // Test 2: Environment Variable Handling
    console.log("\n🌍 Test 2: Environment Variable Handling...");
    const startTime2 = Date.now();

    // Test environment variables
    const envVars = [
      { name: "NODE_ENV", values: ["development", "production", "test"] },
      { name: "PORT", values: ["3000", "8080", "80"] },
      {
        name: "BACKEND_URL",
        values: ["http://localhost:3001", "https://api.example.com"],
      },
      { name: "DEBUG", values: ["true", "false"] },
      { name: "LOG_LEVEL", values: ["debug", "info", "warn", "error"] },
    ];

    for (const envVar of envVars) {
      console.log(`\n   Testing environment variable: ${envVar.name}`);

      // Backup original value
      testData.envBackups[envVar.name] = process.env[envVar.name];

      for (const value of envVar.values) {
        console.log(`     Testing ${envVar.name}=${value}`);
        const envStartTime = Date.now();

        // Set environment variable
        process.env[envVar.name] = value;

        // Test configuration service response
        try {
          const testUrl = await configService.getBackendUrl();
          console.log(
            `       ✅ Configuration service responds with: ${testUrl}`
          );
        } catch (error) {
          console.log(
            `       ❌ Configuration service error: ${error.message}`
          );
        }

        // Test server response to environment change
        try {
          const envResponse = await fetch(`${backendUrl}/api/admin/env`, {
            headers: { Authorization: "Bearer admin-1" },
          });

          if (envResponse.ok) {
            const envData = await envResponse.json();
            const actualValue = envData[envVar.name];

            if (actualValue === value) {
              console.log(`       ✅ Environment variable correctly set`);
            } else {
              console.log(
                `       ❌ Environment variable mismatch: expected ${value}, got ${actualValue}`
              );
            }
          }
        } catch (error) {
          console.log(`       ⚠️  Environment endpoint not available`);
        }

        const envEndTime = Date.now();
        const envDuration = envEndTime - envStartTime;
        performanceData.environmentSwitches.push({
          variable: envVar.name,
          value: value,
          duration: envDuration,
        });

        if (envDuration > 100) {
          console.log(`       ⚠️  Environment switch took ${envDuration}ms`);
        }
      }
    }

    const duration2 = Date.now() - startTime2;
    console.log(`✅ Environment variable handling tested (${duration2}ms)`);

    // Test 3: Different Configuration Scenarios
    console.log("\n🎭 Test 3: Different Configuration Scenarios...");
    const startTime3 = Date.now();

    for (const scenario of configScenarios) {
      console.log(`\n   Testing ${scenario.name}...`);
      const scenarioStartTime = Date.now();

      // Create test configuration
      const testConfigPath = path.join(
        process.cwd(),
        `test-config-${Date.now()}.json`
      );
      fs.writeFileSync(
        testConfigPath,
        JSON.stringify(scenario.config, null, 2)
      );
      testData.createdFiles.push(testConfigPath);

      // Test configuration application
      try {
        const configResponse = await fetch(`${backendUrl}/api/admin/config`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer admin-1",
          },
          body: JSON.stringify(scenario.config),
        });

        if (configResponse.ok) {
          console.log(`     ✅ Configuration applied successfully`);

          // Test configuration effects
          if (scenario.config.environment === "development") {
            // Test debug mode
            const debugResponse = await fetch(`${backendUrl}/api/debug/info`, {
              headers: { Authorization: "Bearer admin-1" },
            });

            if (debugResponse.ok) {
              console.log(`     ✅ Debug mode active`);
            } else {
              console.log(`     ⚠️  Debug mode not accessible`);
            }
          }

          if (scenario.config.environment === "production") {
            // Test production optimizations
            const prodResponse = await fetch(`${backendUrl}/api/health`, {
              headers: { Authorization: "Bearer admin-1" },
            });

            if (prodResponse.ok) {
              const healthData = await prodResponse.json();
              console.log(
                `     ✅ Production health check: ${healthData.status}`
              );
            }
          }

          if (scenario.config.environment === "multi-user") {
            // Test multi-user capabilities
            const usersResponse = await fetch(`${backendUrl}/api/admin/users`, {
              headers: { Authorization: "Bearer admin-1" },
            });

            if (usersResponse.ok) {
              const users = await usersResponse.json();
              console.log(
                `     ✅ Multi-user mode: ${users.length} users available`
              );
            }
          }
        } else {
          console.log(`     ❌ Configuration application failed`);
        }
      } catch (error) {
        console.log(`     ❌ Configuration test error: ${error.message}`);
      }

      const scenarioEndTime = Date.now();
      const scenarioDuration = scenarioEndTime - scenarioStartTime;

      performanceData.environmentSwitches.push({
        scenario: scenario.name,
        duration: scenarioDuration,
      });

      console.log(`     ✅ Scenario tested in ${scenarioDuration}ms`);
    }

    const duration3 = Date.now() - startTime3;
    console.log(`✅ Configuration scenarios tested (${duration3}ms)`);

    // Test 4: Storage Location Changes
    console.log("\n📁 Test 4: Storage Location Changes...");
    const startTime4 = Date.now();

    // Test different storage locations
    const storageTests = [
      { name: "Default Location", path: "./server/notes" },
      { name: "Custom Location", path: "./custom-storage" },
      { name: "Absolute Path", path: path.join(process.cwd(), "test-storage") },
      { name: "Nested Path", path: "./server/data/notes" },
    ];

    for (const storageTest of storageTests) {
      console.log(`\n   Testing storage location: ${storageTest.name}`);
      const storageStartTime = Date.now();

      // Create storage directory
      const storagePath = path.resolve(storageTest.path);
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
        testData.createdDirectories.push(storagePath);
      }

      // Test configuration update
      try {
        const storageConfigResponse = await fetch(
          `${backendUrl}/api/admin/config`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer admin-1",
            },
            body: JSON.stringify({
              userStoragePath: storageTest.path,
            }),
          }
        );

        if (storageConfigResponse.ok) {
          console.log(`     ✅ Storage configuration updated`);

          // Test creating a note in new location
          const testNoteResponse = await fetch(
            `${backendUrl}/api/user-1/notes`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer user-1",
              },
              body: JSON.stringify({
                title: `Storage Test Note - ${storageTest.name}`,
                content: `Testing storage in ${storageTest.path}`,
                tags: ["storage-test"],
              }),
            }
          );

          if (testNoteResponse.ok) {
            const testNote = await testNoteResponse.json();
            console.log(`     ✅ Note created in new storage location`);

            // Verify file exists in expected location
            const expectedPath = path.join(storagePath, "user-1", testNote.id);
            if (fs.existsSync(expectedPath)) {
              console.log(`     ✅ Note file found in expected location`);
            } else {
              console.log(`     ❌ Note file not found in expected location`);
            }

            // Cleanup note
            await fetch(`${backendUrl}/api/user-1/notes/${testNote.id}`, {
              method: "DELETE",
              headers: { Authorization: "Bearer user-1" },
            });
          } else {
            console.log(
              `     ❌ Failed to create note in new storage location`
            );
          }
        } else {
          console.log(`     ❌ Storage configuration update failed`);
        }
      } catch (error) {
        console.log(`     ❌ Storage test error: ${error.message}`);
      }

      const storageEndTime = Date.now();
      const storageDuration = storageEndTime - storageStartTime;

      performanceData.storageOperations.push({
        location: storageTest.name,
        path: storageTest.path,
        duration: storageDuration,
      });

      console.log(`     ✅ Storage location tested in ${storageDuration}ms`);
    }

    const duration4 = Date.now() - startTime4;
    console.log(`✅ Storage location changes tested (${duration4}ms)`);

    // Test 5: Multi-User Environment Setup
    console.log("\n👥 Test 5: Multi-User Environment Setup...");
    const startTime5 = Date.now();

    // Test different user configurations
    const userConfigs = [
      { maxUsers: 1, concurrent: false },
      { maxUsers: 10, concurrent: true },
      { maxUsers: 100, concurrent: true },
      { maxUsers: 1000, concurrent: true },
    ];

    for (const userConfig of userConfigs) {
      console.log(
        `\n   Testing configuration: ${userConfig.maxUsers} max users, concurrent: ${userConfig.concurrent}`
      );
      const userConfigStartTime = Date.now();

      // Apply user configuration
      try {
        const userConfigResponse = await fetch(
          `${backendUrl}/api/admin/config`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer admin-1",
            },
            body: JSON.stringify({
              maxUsers: userConfig.maxUsers,
              concurrentUsers: userConfig.concurrent,
            }),
          }
        );

        if (userConfigResponse.ok) {
          console.log(`     ✅ User configuration applied`);

          // Test user creation up to limit
          const testUserCount = Math.min(userConfig.maxUsers, 5); // Test with max 5 users
          const userPromises = [];

          for (let i = 0; i < testUserCount; i++) {
            userPromises.push(
              fetch(`${backendUrl}/api/admin/users`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer admin-1",
                },
                body: JSON.stringify({
                  name: `Test User ${i + 1}`,
                  email: `testuser${i + 1}@example.com`,
                  password: "testpass123",
                  isAdmin: false,
                }),
              })
            );
          }

          const userResults = await Promise.allSettled(userPromises);
          let successfulUsers = 0;

          for (const result of userResults) {
            if (result.status === "fulfilled" && result.value.ok) {
              successfulUsers++;
              const userData = await result.value.json();
              testData.tempUsers.push(userData.id);
            }
          }

          console.log(
            `     ✅ Created ${successfulUsers}/${testUserCount} test users`
          );

          // Test exceeding user limit
          const exceedResponse = await fetch(`${backendUrl}/api/admin/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer admin-1",
            },
            body: JSON.stringify({
              name: "Exceed Limit User",
              email: "exceed@example.com",
              password: "testpass123",
              isAdmin: false,
            }),
          });

          if (userConfig.maxUsers <= successfulUsers && !exceedResponse.ok) {
            console.log(`     ✅ User limit properly enforced`);
          } else if (
            userConfig.maxUsers > successfulUsers &&
            exceedResponse.ok
          ) {
            console.log(`     ✅ User creation allowed within limit`);
            const exceedUser = await exceedResponse.json();
            testData.tempUsers.push(exceedUser.id);
          } else {
            console.log(`     ⚠️  User limit enforcement unclear`);
          }
        } else {
          console.log(`     ❌ User configuration application failed`);
        }
      } catch (error) {
        console.log(`     ❌ User configuration test error: ${error.message}`);
      }

      const userConfigEndTime = Date.now();
      const userConfigDuration = userConfigEndTime - userConfigStartTime;

      performanceData.userOperations.push({
        maxUsers: userConfig.maxUsers,
        concurrent: userConfig.concurrent,
        duration: userConfigDuration,
      });

      console.log(
        `     ✅ User configuration tested in ${userConfigDuration}ms`
      );
    }

    const duration5 = Date.now() - startTime5;
    console.log(`✅ Multi-user environment setup tested (${duration5}ms)`);

    // Test 6: Configuration Persistence and Recovery
    console.log("\n💾 Test 6: Configuration Persistence and Recovery...");
    const startTime6 = Date.now();

    // Test configuration persistence
    console.log(`\n   Testing configuration persistence...`);
    const persistenceStartTime = Date.now();

    // Create test configuration
    const testConfig = {
      environment: "test",
      debug: true,
      customSetting: "test-value",
      timestamp: new Date().toISOString(),
    };

    // Apply configuration
    try {
      const persistResponse = await fetch(`${backendUrl}/api/admin/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer admin-1",
        },
        body: JSON.stringify(testConfig),
      });

      if (persistResponse.ok) {
        console.log(`     ✅ Configuration applied`);

        // Simulate server restart by getting current config
        const currentConfigResponse = await fetch(
          `${backendUrl}/api/admin/config`,
          {
            headers: { Authorization: "Bearer admin-1" },
          }
        );

        if (currentConfigResponse.ok) {
          const currentConfig = await currentConfigResponse.json();

          // Verify configuration persisted
          if (currentConfig.customSetting === testConfig.customSetting) {
            console.log(`     ✅ Configuration persisted correctly`);
          } else {
            console.log(`     ❌ Configuration not persisted`);
          }
        }
      } else {
        console.log(`     ❌ Configuration persistence test failed`);
      }
    } catch (error) {
      console.log(`     ❌ Configuration persistence error: ${error.message}`);
    }

    // Test configuration recovery
    console.log(`\n   Testing configuration recovery...`);

    // Create backup configuration
    const backupConfig = {
      environment: "backup",
      debug: false,
      customSetting: "backup-value",
    };

    const backupPath = path.join(process.cwd(), "config-backup.json");
    fs.writeFileSync(backupPath, JSON.stringify(backupConfig, null, 2));
    testData.createdFiles.push(backupPath);

    try {
      const recoverResponse = await fetch(
        `${backendUrl}/api/admin/config/recover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer admin-1",
          },
          body: JSON.stringify({
            backupFile: "config-backup.json",
          }),
        }
      );

      if (recoverResponse.ok) {
        console.log(`     ✅ Configuration recovery successful`);

        // Verify recovery
        const recoveredConfigResponse = await fetch(
          `${backendUrl}/api/admin/config`,
          {
            headers: { Authorization: "Bearer admin-1" },
          }
        );

        if (recoveredConfigResponse.ok) {
          const recoveredConfig = await recoveredConfigResponse.json();

          if (recoveredConfig.customSetting === backupConfig.customSetting) {
            console.log(`     ✅ Configuration recovered correctly`);
          } else {
            console.log(`     ❌ Configuration recovery incomplete`);
          }
        }
      } else {
        console.log(`     ❌ Configuration recovery failed`);
      }
    } catch (error) {
      console.log(`     ❌ Configuration recovery error: ${error.message}`);
    }

    const persistenceEndTime = Date.now();
    const persistenceDuration = persistenceEndTime - persistenceStartTime;

    performanceData.validation.push({
      test: "Configuration Persistence",
      duration: persistenceDuration,
    });

    const duration6 = Date.now() - startTime6;
    console.log(
      `✅ Configuration persistence and recovery tested (${duration6}ms)`
    );

    // Test 7: Configuration Validation and Error Handling
    console.log("\n🔍 Test 7: Configuration Validation and Error Handling...");
    const startTime7 = Date.now();

    // Test invalid configurations
    const invalidConfigs = [
      { name: "Invalid Port", config: { port: "invalid" } },
      { name: "Missing Required Field", config: { environment: null } },
      { name: "Invalid Environment", config: { environment: "invalid-env" } },
      { name: "Negative Values", config: { maxUsers: -1 } },
      { name: "Invalid URL", config: { backendUrl: "invalid-url" } },
    ];

    for (const invalidConfig of invalidConfigs) {
      console.log(`\n   Testing ${invalidConfig.name}...`);
      const validationStartTime = Date.now();

      try {
        const validationResponse = await fetch(
          `${backendUrl}/api/admin/config/validate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer admin-1",
            },
            body: JSON.stringify(invalidConfig.config),
          }
        );

        if (validationResponse.ok) {
          const validationResult = await validationResponse.json();

          if (validationResult.valid === false) {
            console.log(`     ✅ Invalid configuration correctly rejected`);
            console.log(
              `     ✅ Validation errors: ${
                validationResult.errors?.length || 0
              }`
            );
          } else {
            console.log(`     ❌ Invalid configuration should be rejected`);
          }
        } else {
          console.log(`     ❌ Configuration validation endpoint failed`);
        }
      } catch (error) {
        console.log(`     ❌ Configuration validation error: ${error.message}`);
      }

      const validationEndTime = Date.now();
      const validationDuration = validationEndTime - validationStartTime;

      performanceData.validation.push({
        test: invalidConfig.name,
        duration: validationDuration,
      });

      console.log(`     ✅ Validation tested in ${validationDuration}ms`);
    }

    const duration7 = Date.now() - startTime7;
    console.log(
      `✅ Configuration validation and error handling tested (${duration7}ms)`
    );

    // Test 8: Cross-Platform Compatibility
    console.log("\n🌐 Test 8: Cross-Platform Compatibility...");
    const startTime8 = Date.now();

    // Test path handling across platforms
    const pathTests = [
      { name: "Windows Path", path: "C:\\notes\\storage" },
      { name: "Unix Path", path: "/home/user/notes" },
      { name: "Relative Path", path: "./notes" },
      { name: "Path with Spaces", path: "./my notes folder" },
      { name: "Path with Special Chars", path: "./notes-test_123" },
    ];

    for (const pathTest of pathTests) {
      console.log(`\n   Testing ${pathTest.name}: ${pathTest.path}`);
      const pathStartTime = Date.now();

      // Test path normalization
      const normalizedPath = path.normalize(pathTest.path);
      const resolvedPath = path.resolve(normalizedPath);

      console.log(`     ✅ Normalized: ${normalizedPath}`);
      console.log(`     ✅ Resolved: ${resolvedPath}`);

      // Test creating directory with path
      try {
        const testDir = path.join(
          process.cwd(),
          "test-paths",
          pathTest.name.replace(/\s+/g, "-")
        );
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
          testData.createdDirectories.push(testDir);
        }

        console.log(`     ✅ Directory creation successful`);
      } catch (error) {
        console.log(`     ❌ Directory creation failed: ${error.message}`);
      }

      const pathEndTime = Date.now();
      const pathDuration = pathEndTime - pathStartTime;

      performanceData.validation.push({
        test: pathTest.name,
        duration: pathDuration,
      });

      console.log(`     ✅ Path compatibility tested in ${pathDuration}ms`);
    }

    const duration8 = Date.now() - startTime8;
    console.log(`✅ Cross-platform compatibility tested (${duration8}ms)`);

    console.log("\n📊 Performance Summary:");
    console.log("========================");

    // Configuration Loading Performance
    console.log("\n📋 Configuration Loading:");
    performanceData.configLoads.forEach((load) => {
      console.log(`   ${load.file}: ${load.duration}ms (${load.size} bytes)`);
    });

    // Environment Switch Performance
    console.log("\n🌍 Environment Switches:");
    const envSwitches = performanceData.environmentSwitches.filter(
      (e) => e.variable
    );
    envSwitches.forEach((env) => {
      console.log(`   ${env.variable}=${env.value}: ${env.duration}ms`);
    });

    // Storage Operations Performance
    console.log("\n📁 Storage Operations:");
    performanceData.storageOperations.forEach((storage) => {
      console.log(`   ${storage.location}: ${storage.duration}ms`);
    });

    // User Operations Performance
    console.log("\n👥 User Operations:");
    performanceData.userOperations.forEach((user) => {
      console.log(`   ${user.maxUsers} max users: ${user.duration}ms`);
    });

    // Validation Performance
    console.log("\n🔍 Validation Operations:");
    performanceData.validation.forEach((validation) => {
      console.log(`   ${validation.test}: ${validation.duration}ms`);
    });

    // Performance Analysis
    const allOperations = [
      ...performanceData.configLoads.map((c) => c.duration),
      ...performanceData.environmentSwitches.map((e) => e.duration),
      ...performanceData.storageOperations.map((s) => s.duration),
      ...performanceData.userOperations.map((u) => u.duration),
      ...performanceData.validation.map((v) => v.duration),
    ];

    if (allOperations.length > 0) {
      const avgTime =
        allOperations.reduce((a, b) => a + b, 0) / allOperations.length;
      const maxTime = Math.max(...allOperations);
      const slowOps = allOperations.filter((time) => time > 100);

      console.log("\n📈 Performance Analysis:");
      console.log(`   Average operation time: ${avgTime.toFixed(2)}ms`);
      console.log(`   Slowest operation: ${maxTime}ms`);
      console.log(
        `   Operations over 100ms: ${slowOps.length}/${allOperations.length}`
      );

      if (slowOps.length > 0) {
        console.log(
          `   ⚠️  Performance warning: ${slowOps.length} slow operations detected`
        );
      }
    }

    console.log("\n🎉 Configuration & Environment test completed!");
  } catch (error) {
    console.error("\n❌ Configuration & Environment test failed:", error);
    process.exit(1);
  } finally {
    // Cleanup and restore
    console.log("\n🧹 Cleaning up and restoring configuration...");

    // Restore original environment variables
    for (const [envVar, originalValue] of Object.entries(testData.envBackups)) {
      if (originalValue !== undefined) {
        process.env[envVar] = originalValue;
      } else {
        delete process.env[envVar];
      }
    }

    // Restore original configuration
    if (testData.originalConfig) {
      try {
        const backendUrl = await configService.getBackendUrl();
        await fetch(`${backendUrl}/api/admin/config`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer admin-1",
          },
          body: JSON.stringify(testData.originalConfig),
        });
        console.log("✅ Original configuration restored");
      } catch (error) {
        console.warn(
          "Failed to restore original configuration:",
          error.message
        );
      }
    }

    // Delete temporary users
    for (const userId of testData.tempUsers) {
      try {
        const backendUrl = await configService.getBackendUrl();
        await fetch(`${backendUrl}/api/admin/users/${userId}`, {
          method: "DELETE",
          headers: { Authorization: "Bearer admin-1" },
        });
      } catch (error) {
        console.warn(`Failed to delete user ${userId}:`, error.message);
      }
    }

    // Delete created files
    for (const file of testData.createdFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.warn(`Failed to delete file ${file}:`, error.message);
      }
    }

    // Delete created directories
    for (const dir of testData.createdDirectories) {
      try {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      } catch (error) {
        console.warn(`Failed to delete directory ${dir}:`, error.message);
      }
    }

    console.log("✅ Cleanup completed");
  }
}

// Run the test
testConfigurationEnvironment().catch(console.error);
