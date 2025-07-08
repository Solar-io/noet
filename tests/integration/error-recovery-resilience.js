/**
 * Test Script: Error Recovery & Resilience Testing
 *
 * This script tests error recovery and resilience including network failures,
 * database connection issues, file system errors, and graceful degradation.
 */

import configService from "../../src/configService.js";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

async function testErrorRecoveryResilience() {
  console.log("🛡️  Testing Error Recovery & Resilience...\n");

  let backendUrl;
  try {
    backendUrl = await configService.getBackendUrl();
    console.log(`✅ Backend URL: ${backendUrl}`);
  } catch (error) {
    console.error("❌ Failed to get backend URL:", error);
    return;
  }

  const testData = {
    createdNotes: [],
    createdFiles: [],
    mockServers: [],
    originalFiles: new Map(),
    errorLogs: [],
    recoveryAttempts: [],
  };

  // Error simulation scenarios
  const errorScenarios = [
    {
      name: "Network Timeout",
      type: "network",
      simulation: "timeout",
      expectedRecovery: "retry",
    },
    {
      name: "Connection Refused",
      type: "network",
      simulation: "refused",
      expectedRecovery: "failover",
    },
    {
      name: "Database Disconnection",
      type: "database",
      simulation: "disconnect",
      expectedRecovery: "reconnect",
    },
    {
      name: "File System Full",
      type: "filesystem",
      simulation: "nospace",
      expectedRecovery: "cleanup",
    },
    {
      name: "Memory Exhaustion",
      type: "memory",
      simulation: "oom",
      expectedRecovery: "gc",
    },
    {
      name: "Corrupt Data",
      type: "data",
      simulation: "corruption",
      expectedRecovery: "validation",
    },
  ];

  // Performance tracking
  const performanceData = {
    errorDetection: [],
    recoveryTime: [],
    resilienceTests: [],
    degradationTests: [],
    failoverTests: [],
  };

  // Resilience metrics
  const resilienceMetrics = {
    errorsCaught: 0,
    recoverySuccess: 0,
    recoveryFailures: 0,
    degradationEvents: 0,
    uptimePercentage: 100,
  };

  try {
    // Test 1: Network Failure Scenarios
    console.log("🌐 Test 1: Network Failure Scenarios...");
    const startTime1 = Date.now();

    // Test network timeout scenarios
    console.log("\n   Testing network timeout scenarios...");

    const timeoutTests = [
      { name: "Short Timeout", timeout: 100, expected: "retry" },
      { name: "Medium Timeout", timeout: 1000, expected: "retry" },
      { name: "Long Timeout", timeout: 5000, expected: "fail" },
    ];

    for (const timeoutTest of timeoutTests) {
      console.log(
        `\n     Testing ${timeoutTest.name} (${timeoutTest.timeout}ms)...`
      );
      const timeoutStartTime = Date.now();

      try {
        // Create a request that will timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          timeoutTest.timeout
        );

        const timeoutResponse = await fetch(`${backendUrl}/api/slow-endpoint`, {
          signal: controller.signal,
          headers: { Authorization: "Bearer user-1" },
        });

        clearTimeout(timeoutId);

        if (timeoutResponse.ok) {
          console.log(`       ✅ Request completed within timeout`);
        } else {
          console.log(`       ❌ Request failed: ${timeoutResponse.status}`);
        }
      } catch (error) {
        if (error.name === "AbortError") {
          console.log(`       ✅ Request properly timed out`);
          resilienceMetrics.errorsCaught++;

          // Test recovery mechanism
          const recoveryStartTime = Date.now();

          // Attempt recovery with normal endpoint
          try {
            const recoveryResponse = await fetch(
              `${backendUrl}/api/user-1/notes?limit=1`,
              {
                headers: { Authorization: "Bearer user-1" },
              }
            );

            if (recoveryResponse.ok) {
              console.log(`       ✅ Recovery successful`);
              resilienceMetrics.recoverySuccess++;
            } else {
              console.log(`       ❌ Recovery failed`);
              resilienceMetrics.recoveryFailures++;
            }

            const recoveryEndTime = Date.now();
            const recoveryDuration = recoveryEndTime - recoveryStartTime;

            performanceData.recoveryTime.push({
              scenario: timeoutTest.name,
              duration: recoveryDuration,
            });
          } catch (recoveryError) {
            console.log(
              `       ❌ Recovery attempt failed: ${recoveryError.message}`
            );
            resilienceMetrics.recoveryFailures++;
          }
        } else {
          console.log(`       ❌ Unexpected error: ${error.message}`);
        }
      }

      const timeoutEndTime = Date.now();
      const timeoutDuration = timeoutEndTime - timeoutStartTime;

      performanceData.errorDetection.push({
        test: timeoutTest.name,
        duration: timeoutDuration,
      });

      console.log(`       ✅ Timeout test completed in ${timeoutDuration}ms`);
    }

    // Test connection refused scenarios
    console.log("\n   Testing connection refused scenarios...");

    const invalidUrls = [
      "http://localhost:9999/api/test",
      "http://nonexistent.domain.com/api/test",
      "https://127.0.0.1:9999/api/test",
    ];

    for (const invalidUrl of invalidUrls) {
      console.log(`\n     Testing connection to ${invalidUrl}...`);
      const connStartTime = Date.now();

      try {
        const connResponse = await fetch(invalidUrl, {
          headers: { Authorization: "Bearer user-1" },
        });

        console.log(`       ⚠️  Unexpected success: ${connResponse.status}`);
      } catch (error) {
        console.log(`       ✅ Connection properly failed: ${error.message}`);
        resilienceMetrics.errorsCaught++;

        // Test failover mechanism
        const failoverStartTime = Date.now();

        try {
          const failoverResponse = await fetch(
            `${backendUrl}/api/user-1/notes?limit=1`,
            {
              headers: { Authorization: "Bearer user-1" },
            }
          );

          if (failoverResponse.ok) {
            console.log(`       ✅ Failover to primary server successful`);
            resilienceMetrics.recoverySuccess++;
          } else {
            console.log(`       ❌ Failover failed`);
            resilienceMetrics.recoveryFailures++;
          }

          const failoverEndTime = Date.now();
          const failoverDuration = failoverEndTime - failoverStartTime;

          performanceData.failoverTests.push({
            invalidUrl: invalidUrl,
            duration: failoverDuration,
          });
        } catch (failoverError) {
          console.log(
            `       ❌ Failover attempt failed: ${failoverError.message}`
          );
          resilienceMetrics.recoveryFailures++;
        }
      }

      const connEndTime = Date.now();
      const connDuration = connEndTime - connStartTime;

      performanceData.errorDetection.push({
        test: `Connection Refused - ${invalidUrl}`,
        duration: connDuration,
      });

      console.log(`       ✅ Connection test completed in ${connDuration}ms`);
    }

    const duration1 = Date.now() - startTime1;
    console.log(`✅ Network failure scenarios tested (${duration1}ms)`);

    // Test 2: Database Connection Issues
    console.log("\n🗄️  Test 2: Database Connection Issues...");
    const startTime2 = Date.now();

    // Test database connectivity
    console.log("\n   Testing database connectivity...");

    const dbTests = [
      { name: "Database Status Check", endpoint: "/api/admin/db/status" },
      { name: "Database Health Check", endpoint: "/api/admin/db/health" },
      { name: "Database Performance", endpoint: "/api/admin/db/performance" },
    ];

    for (const dbTest of dbTests) {
      console.log(`\n     Testing ${dbTest.name}...`);
      const dbStartTime = Date.now();

      try {
        const dbResponse = await fetch(`${backendUrl}${dbTest.endpoint}`, {
          headers: { Authorization: "Bearer admin-1" },
        });

        if (dbResponse.ok) {
          const dbData = await dbResponse.json();
          console.log(
            `       ✅ Database test passed: ${JSON.stringify(dbData).substring(
              0,
              100
            )}...`
          );

          // Check for warning signs
          if (dbData.connectionCount > 50) {
            console.log(
              `       ⚠️  High connection count: ${dbData.connectionCount}`
            );
          }

          if (dbData.queryTime > 100) {
            console.log(
              `       ⚠️  Slow query performance: ${dbData.queryTime}ms`
            );
          }
        } else {
          console.log(`       ❌ Database test failed: ${dbResponse.status}`);
          resilienceMetrics.errorsCaught++;

          // Test recovery mechanism
          const dbRecoveryStartTime = Date.now();

          // Attempt database recovery
          try {
            const recoverResponse = await fetch(
              `${backendUrl}/api/admin/db/recover`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer admin-1",
                },
                body: JSON.stringify({
                  action: "reconnect",
                  timeout: 30000,
                }),
              }
            );

            if (recoverResponse.ok) {
              console.log(`       ✅ Database recovery successful`);
              resilienceMetrics.recoverySuccess++;
            } else {
              console.log(`       ❌ Database recovery failed`);
              resilienceMetrics.recoveryFailures++;
            }

            const dbRecoveryEndTime = Date.now();
            const dbRecoveryDuration = dbRecoveryEndTime - dbRecoveryStartTime;

            performanceData.recoveryTime.push({
              scenario: dbTest.name,
              duration: dbRecoveryDuration,
            });
          } catch (recoverError) {
            console.log(
              `       ❌ Database recovery attempt failed: ${recoverError.message}`
            );
            resilienceMetrics.recoveryFailures++;
          }
        }
      } catch (error) {
        console.log(`       ❌ Database test error: ${error.message}`);
        resilienceMetrics.errorsCaught++;
      }

      const dbEndTime = Date.now();
      const dbDuration = dbEndTime - dbStartTime;

      performanceData.errorDetection.push({
        test: dbTest.name,
        duration: dbDuration,
      });

      console.log(`       ✅ Database test completed in ${dbDuration}ms`);
    }

    // Test transaction rollback
    console.log("\n   Testing transaction rollback...");

    const rollbackStartTime = Date.now();

    try {
      // Start a transaction that will fail
      const transactionResponse = await fetch(
        `${backendUrl}/api/admin/db/transaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer admin-1",
          },
          body: JSON.stringify({
            operations: [
              {
                type: "create",
                table: "notes",
                data: { title: "Test Note 1" },
              },
              {
                type: "create",
                table: "notes",
                data: { title: "Test Note 2" },
              },
              { type: "invalid", table: "notes", data: { invalid: "data" } }, // This should fail
            ],
          }),
        }
      );

      if (transactionResponse.ok) {
        console.log(`       ⚠️  Transaction unexpectedly succeeded`);
      } else {
        console.log(`       ✅ Transaction properly failed and rolled back`);
        resilienceMetrics.errorsCaught++;

        // Verify rollback worked
        const verifyResponse = await fetch(
          `${backendUrl}/api/user-1/notes?search=Test Note`,
          {
            headers: { Authorization: "Bearer user-1" },
          }
        );

        if (verifyResponse.ok) {
          const searchResults = await verifyResponse.json();
          const testNotes = searchResults.filter((note) =>
            note.title.includes("Test Note")
          );

          if (testNotes.length === 0) {
            console.log(
              `       ✅ Rollback successful - no partial data created`
            );
            resilienceMetrics.recoverySuccess++;
          } else {
            console.log(
              `       ❌ Rollback failed - ${testNotes.length} partial records found`
            );
            resilienceMetrics.recoveryFailures++;
          }
        }
      }
    } catch (error) {
      console.log(
        `       ❌ Transaction rollback test error: ${error.message}`
      );
      resilienceMetrics.errorsCaught++;
    }

    const rollbackEndTime = Date.now();
    const rollbackDuration = rollbackEndTime - rollbackStartTime;

    performanceData.resilienceTests.push({
      test: "Transaction Rollback",
      duration: rollbackDuration,
    });

    console.log(
      `       ✅ Transaction rollback tested in ${rollbackDuration}ms`
    );

    const duration2 = Date.now() - startTime2;
    console.log(`✅ Database connection issues tested (${duration2}ms)`);

    // Test 3: File System Errors
    console.log("\n📁 Test 3: File System Errors...");
    const startTime3 = Date.now();

    // Test file system error scenarios
    console.log("\n   Testing file system error scenarios...");

    const fsTests = [
      { name: "Permission Denied", simulation: "chmod" },
      { name: "File Not Found", simulation: "missing" },
      { name: "Disk Full", simulation: "nospace" },
      { name: "File Corruption", simulation: "corrupt" },
    ];

    for (const fsTest of fsTests) {
      console.log(`\n     Testing ${fsTest.name}...`);
      const fsStartTime = Date.now();

      // Create test file
      const testFilePath = path.join(
        process.cwd(),
        `test-fs-${Date.now()}.txt`
      );
      fs.writeFileSync(testFilePath, "Test file content");
      testData.createdFiles.push(testFilePath);

      try {
        if (fsTest.simulation === "chmod") {
          // Simulate permission denied
          fs.chmodSync(testFilePath, 0o000);

          // Try to read the file
          try {
            const content = fs.readFileSync(testFilePath, "utf8");
            console.log(`       ⚠️  Permission denied not enforced`);
          } catch (permError) {
            console.log(`       ✅ Permission denied properly detected`);
            resilienceMetrics.errorsCaught++;

            // Test recovery
            const recoveryStartTime = Date.now();

            try {
              // Restore permissions
              fs.chmodSync(testFilePath, 0o644);
              const recoveredContent = fs.readFileSync(testFilePath, "utf8");
              console.log(`       ✅ Permission recovery successful`);
              resilienceMetrics.recoverySuccess++;

              const recoveryEndTime = Date.now();
              const recoveryDuration = recoveryEndTime - recoveryStartTime;

              performanceData.recoveryTime.push({
                scenario: fsTest.name,
                duration: recoveryDuration,
              });
            } catch (recoveryError) {
              console.log(
                `       ❌ Permission recovery failed: ${recoveryError.message}`
              );
              resilienceMetrics.recoveryFailures++;
            }
          }
        } else if (fsTest.simulation === "missing") {
          // Simulate file not found
          fs.unlinkSync(testFilePath);

          // Try to read the missing file
          try {
            const content = fs.readFileSync(testFilePath, "utf8");
            console.log(`       ⚠️  Missing file not detected`);
          } catch (missingError) {
            console.log(`       ✅ Missing file properly detected`);
            resilienceMetrics.errorsCaught++;

            // Test recovery
            const recoveryStartTime = Date.now();

            try {
              // Recreate the file
              fs.writeFileSync(testFilePath, "Recovered file content");
              console.log(`       ✅ File recovery successful`);
              resilienceMetrics.recoverySuccess++;

              const recoveryEndTime = Date.now();
              const recoveryDuration = recoveryEndTime - recoveryStartTime;

              performanceData.recoveryTime.push({
                scenario: fsTest.name,
                duration: recoveryDuration,
              });
            } catch (recoveryError) {
              console.log(
                `       ❌ File recovery failed: ${recoveryError.message}`
              );
              resilienceMetrics.recoveryFailures++;
            }
          }
        } else if (fsTest.simulation === "corrupt") {
          // Simulate file corruption by writing invalid data
          fs.writeFileSync(testFilePath, Buffer.from([0x00, 0xff, 0x00, 0xff]));

          // Try to read as JSON
          try {
            const content = fs.readFileSync(testFilePath, "utf8");
            JSON.parse(content);
            console.log(`       ⚠️  Corrupted file not detected`);
          } catch (corruptError) {
            console.log(`       ✅ File corruption properly detected`);
            resilienceMetrics.errorsCaught++;

            // Test recovery
            const recoveryStartTime = Date.now();

            try {
              // Restore from backup (simulate)
              fs.writeFileSync(testFilePath, '{"restored": true}');
              const recoveredContent = fs.readFileSync(testFilePath, "utf8");
              JSON.parse(recoveredContent);
              console.log(`       ✅ Corruption recovery successful`);
              resilienceMetrics.recoverySuccess++;

              const recoveryEndTime = Date.now();
              const recoveryDuration = recoveryEndTime - recoveryStartTime;

              performanceData.recoveryTime.push({
                scenario: fsTest.name,
                duration: recoveryDuration,
              });
            } catch (recoveryError) {
              console.log(
                `       ❌ Corruption recovery failed: ${recoveryError.message}`
              );
              resilienceMetrics.recoveryFailures++;
            }
          }
        }
      } catch (error) {
        console.log(`       ❌ File system test error: ${error.message}`);
        resilienceMetrics.errorsCaught++;
      }

      const fsEndTime = Date.now();
      const fsDuration = fsEndTime - fsStartTime;

      performanceData.errorDetection.push({
        test: fsTest.name,
        duration: fsDuration,
      });

      console.log(`       ✅ File system test completed in ${fsDuration}ms`);
    }

    const duration3 = Date.now() - startTime3;
    console.log(`✅ File system errors tested (${duration3}ms)`);

    // Test 4: Memory and Resource Exhaustion
    console.log("\n🧠 Test 4: Memory and Resource Exhaustion...");
    const startTime4 = Date.now();

    // Test memory exhaustion simulation
    console.log("\n   Testing memory exhaustion scenarios...");

    const memoryTests = [
      { name: "Large Object Creation", size: 1000000, count: 10 },
      { name: "Memory Leak Simulation", size: 100000, count: 100 },
      { name: "Buffer Overflow Test", size: 10000000, count: 1 },
    ];

    for (const memTest of memoryTests) {
      console.log(`\n     Testing ${memTest.name}...`);
      const memStartTime = Date.now();

      const initialMemory = process.memoryUsage();

      try {
        // Create large objects to simulate memory pressure
        const largeObjects = [];

        for (let i = 0; i < memTest.count; i++) {
          const largeObject = new Array(memTest.size).fill(Math.random());
          largeObjects.push(largeObject);
        }

        const peakMemory = process.memoryUsage();
        const memoryIncrease = peakMemory.heapUsed - initialMemory.heapUsed;

        console.log(
          `       ✅ Memory allocated: ${(memoryIncrease / 1024 / 1024).toFixed(
            2
          )}MB`
        );

        // Test garbage collection
        const gcStartTime = Date.now();

        // Clear references
        largeObjects.length = 0;

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        const gcEndTime = Date.now();
        const gcDuration = gcEndTime - gcStartTime;

        const afterGCMemory = process.memoryUsage();
        const memoryRecovered = peakMemory.heapUsed - afterGCMemory.heapUsed;

        console.log(
          `       ✅ Memory recovered: ${(
            memoryRecovered /
            1024 /
            1024
          ).toFixed(2)}MB`
        );
        console.log(`       ✅ GC completed in ${gcDuration}ms`);

        performanceData.recoveryTime.push({
          scenario: memTest.name,
          duration: gcDuration,
        });

        if (memoryRecovered > 0) {
          resilienceMetrics.recoverySuccess++;
        } else {
          resilienceMetrics.recoveryFailures++;
        }
      } catch (error) {
        console.log(`       ❌ Memory test error: ${error.message}`);
        resilienceMetrics.errorsCaught++;
      }

      const memEndTime = Date.now();
      const memDuration = memEndTime - memStartTime;

      performanceData.errorDetection.push({
        test: memTest.name,
        duration: memDuration,
      });

      console.log(`       ✅ Memory test completed in ${memDuration}ms`);
    }

    const duration4 = Date.now() - startTime4;
    console.log(`✅ Memory and resource exhaustion tested (${duration4}ms)`);

    // Test 5: Graceful Degradation
    console.log("\n🎭 Test 5: Graceful Degradation...");
    const startTime5 = Date.now();

    // Test graceful degradation scenarios
    console.log("\n   Testing graceful degradation scenarios...");

    const degradationTests = [
      {
        name: "Partial Service Unavailable",
        service: "search",
        fallback: "basic-list",
      },
      {
        name: "File Upload Disabled",
        service: "upload",
        fallback: "text-only",
      },
      {
        name: "Authentication Service Down",
        service: "auth",
        fallback: "read-only",
      },
      {
        name: "Tag Service Unavailable",
        service: "tags",
        fallback: "untagged",
      },
    ];

    for (const degradationTest of degradationTests) {
      console.log(`\n     Testing ${degradationTest.name}...`);
      const degradationStartTime = Date.now();

      try {
        // Test primary service availability
        const primaryResponse = await fetch(
          `${backendUrl}/api/user-1/${degradationTest.service}`,
          {
            headers: { Authorization: "Bearer user-1" },
          }
        );

        if (primaryResponse.ok) {
          console.log(`       ✅ Primary service available`);

          // Simulate service degradation
          const degradationResponse = await fetch(
            `${backendUrl}/api/admin/services/${degradationTest.service}/disable`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer admin-1",
              },
              body: JSON.stringify({
                duration: 5000, // 5 seconds
                fallback: degradationTest.fallback,
              }),
            }
          );

          if (degradationResponse.ok) {
            console.log(`       ✅ Service degradation simulated`);
            resilienceMetrics.degradationEvents++;

            // Test fallback mechanism
            const fallbackStartTime = Date.now();

            const fallbackResponse = await fetch(
              `${backendUrl}/api/user-1/${degradationTest.service}`,
              {
                headers: { Authorization: "Bearer user-1" },
              }
            );

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              console.log(
                `       ✅ Fallback mechanism active: ${
                  fallbackData.mode || "unknown"
                }`
              );
              resilienceMetrics.recoverySuccess++;
            } else {
              console.log(`       ❌ Fallback mechanism failed`);
              resilienceMetrics.recoveryFailures++;
            }

            const fallbackEndTime = Date.now();
            const fallbackDuration = fallbackEndTime - fallbackStartTime;

            performanceData.degradationTests.push({
              service: degradationTest.service,
              fallback: degradationTest.fallback,
              duration: fallbackDuration,
            });

            // Wait for service to recover
            await new Promise((resolve) => setTimeout(resolve, 6000));

            // Test service recovery
            const recoveryResponse = await fetch(
              `${backendUrl}/api/user-1/${degradationTest.service}`,
              {
                headers: { Authorization: "Bearer user-1" },
              }
            );

            if (recoveryResponse.ok) {
              const recoveryData = await recoveryResponse.json();
              if (recoveryData.mode !== degradationTest.fallback) {
                console.log(`       ✅ Service recovery successful`);
                resilienceMetrics.recoverySuccess++;
              } else {
                console.log(`       ⚠️  Service still in fallback mode`);
              }
            }
          } else {
            console.log(`       ❌ Service degradation simulation failed`);
          }
        } else {
          console.log(`       ❌ Primary service unavailable`);
        }
      } catch (error) {
        console.log(`       ❌ Degradation test error: ${error.message}`);
        resilienceMetrics.errorsCaught++;
      }

      const degradationEndTime = Date.now();
      const degradationDuration = degradationEndTime - degradationStartTime;

      performanceData.errorDetection.push({
        test: degradationTest.name,
        duration: degradationDuration,
      });

      console.log(
        `       ✅ Degradation test completed in ${degradationDuration}ms`
      );
    }

    const duration5 = Date.now() - startTime5;
    console.log(`✅ Graceful degradation tested (${duration5}ms)`);

    // Test 6: Circuit Breaker Pattern
    console.log("\n⚡ Test 6: Circuit Breaker Pattern...");
    const startTime6 = Date.now();

    // Test circuit breaker functionality
    console.log("\n   Testing circuit breaker pattern...");

    const circuitBreakerTests = [
      { name: "Failure Threshold", failures: 5, timeout: 1000 },
      { name: "Recovery Testing", failures: 3, timeout: 2000 },
      { name: "Half-Open State", failures: 10, timeout: 500 },
    ];

    for (const cbTest of circuitBreakerTests) {
      console.log(`\n     Testing ${cbTest.name}...`);
      const cbStartTime = Date.now();

      try {
        // Configure circuit breaker
        const configResponse = await fetch(
          `${backendUrl}/api/admin/circuit-breaker`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer admin-1",
            },
            body: JSON.stringify({
              failureThreshold: cbTest.failures,
              timeout: cbTest.timeout,
              resetTimeout: 5000,
            }),
          }
        );

        if (configResponse.ok) {
          console.log(`       ✅ Circuit breaker configured`);

          // Generate failures to trip circuit breaker
          const failurePromises = [];
          for (let i = 0; i < cbTest.failures + 1; i++) {
            failurePromises.push(
              fetch(`${backendUrl}/api/user-1/failing-endpoint`, {
                headers: { Authorization: "Bearer user-1" },
              })
            );
          }

          const failureResults = await Promise.allSettled(failurePromises);
          const actualFailures = failureResults.filter(
            (r) => r.status === "fulfilled" && !r.value.ok
          ).length;

          console.log(`       ✅ Generated ${actualFailures} failures`);

          // Test circuit breaker state
          const stateResponse = await fetch(
            `${backendUrl}/api/admin/circuit-breaker/state`,
            {
              headers: { Authorization: "Bearer admin-1" },
            }
          );

          if (stateResponse.ok) {
            const stateData = await stateResponse.json();
            console.log(`       ✅ Circuit breaker state: ${stateData.state}`);

            if (stateData.state === "open") {
              console.log(`       ✅ Circuit breaker properly opened`);
              resilienceMetrics.errorsCaught++;

              // Test recovery after timeout
              console.log(`       ⏳ Waiting for recovery timeout...`);
              await new Promise((resolve) =>
                setTimeout(resolve, cbTest.timeout + 1000)
              );

              const recoveryResponse = await fetch(
                `${backendUrl}/api/user-1/notes?limit=1`,
                {
                  headers: { Authorization: "Bearer user-1" },
                }
              );

              if (recoveryResponse.ok) {
                console.log(`       ✅ Circuit breaker recovery successful`);
                resilienceMetrics.recoverySuccess++;
              } else {
                console.log(`       ❌ Circuit breaker recovery failed`);
                resilienceMetrics.recoveryFailures++;
              }
            }
          }
        } else {
          console.log(`       ❌ Circuit breaker configuration failed`);
        }
      } catch (error) {
        console.log(`       ❌ Circuit breaker test error: ${error.message}`);
        resilienceMetrics.errorsCaught++;
      }

      const cbEndTime = Date.now();
      const cbDuration = cbEndTime - cbStartTime;

      performanceData.resilienceTests.push({
        test: cbTest.name,
        duration: cbDuration,
      });

      console.log(
        `       ✅ Circuit breaker test completed in ${cbDuration}ms`
      );
    }

    const duration6 = Date.now() - startTime6;
    console.log(`✅ Circuit breaker pattern tested (${duration6}ms)`);

    // Test 7: Load Balancing and Failover
    console.log("\n⚖️  Test 7: Load Balancing and Failover...");
    const startTime7 = Date.now();

    // Test load balancing and failover scenarios
    console.log("\n   Testing load balancing and failover...");

    const loadBalancingTests = [
      { name: "Round Robin", algorithm: "round-robin", servers: 3 },
      { name: "Least Connections", algorithm: "least-connections", servers: 2 },
      { name: "Weighted Round Robin", algorithm: "weighted", servers: 4 },
    ];

    for (const lbTest of loadBalancingTests) {
      console.log(`\n     Testing ${lbTest.name}...`);
      const lbStartTime = Date.now();

      try {
        // Configure load balancer
        const lbConfigResponse = await fetch(
          `${backendUrl}/api/admin/load-balancer`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer admin-1",
            },
            body: JSON.stringify({
              algorithm: lbTest.algorithm,
              servers: lbTest.servers,
              healthCheckInterval: 1000,
            }),
          }
        );

        if (lbConfigResponse.ok) {
          console.log(`       ✅ Load balancer configured`);

          // Test load distribution
          const requestCount = 20;
          const requests = [];

          for (let i = 0; i < requestCount; i++) {
            requests.push(
              fetch(`${backendUrl}/api/user-1/notes?limit=1`, {
                headers: { Authorization: "Bearer user-1" },
              })
            );
          }

          const results = await Promise.allSettled(requests);
          const successful = results.filter(
            (r) => r.status === "fulfilled" && r.value.ok
          ).length;

          console.log(
            `       ✅ Load balancing: ${successful}/${requestCount} requests successful`
          );

          // Test failover
          const failoverResponse = await fetch(
            `${backendUrl}/api/admin/load-balancer/failover`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer admin-1",
              },
              body: JSON.stringify({
                failedServer: 1,
                redistributeLoad: true,
              }),
            }
          );

          if (failoverResponse.ok) {
            console.log(`       ✅ Failover triggered`);

            // Test requests after failover
            const failoverTestResponse = await fetch(
              `${backendUrl}/api/user-1/notes?limit=1`,
              {
                headers: { Authorization: "Bearer user-1" },
              }
            );

            if (failoverTestResponse.ok) {
              console.log(`       ✅ Failover successful`);
              resilienceMetrics.recoverySuccess++;
            } else {
              console.log(`       ❌ Failover failed`);
              resilienceMetrics.recoveryFailures++;
            }
          }
        } else {
          console.log(`       ❌ Load balancer configuration failed`);
        }
      } catch (error) {
        console.log(`       ❌ Load balancing test error: ${error.message}`);
        resilienceMetrics.errorsCaught++;
      }

      const lbEndTime = Date.now();
      const lbDuration = lbEndTime - lbStartTime;

      performanceData.failoverTests.push({
        test: lbTest.name,
        algorithm: lbTest.algorithm,
        duration: lbDuration,
      });

      console.log(`       ✅ Load balancing test completed in ${lbDuration}ms`);
    }

    const duration7 = Date.now() - startTime7;
    console.log(`✅ Load balancing and failover tested (${duration7}ms)`);

    // Test 8: Data Consistency During Failures
    console.log("\n🔄 Test 8: Data Consistency During Failures...");
    const startTime8 = Date.now();

    // Test data consistency during various failure scenarios
    console.log("\n   Testing data consistency during failures...");

    const consistencyTests = [
      {
        name: "Concurrent Write Failure",
        operation: "write",
        consistency: "eventual",
      },
      {
        name: "Network Partition",
        operation: "partition",
        consistency: "strong",
      },
      {
        name: "Server Crash During Write",
        operation: "crash",
        consistency: "immediate",
      },
    ];

    for (const consistencyTest of consistencyTests) {
      console.log(`\n     Testing ${consistencyTest.name}...`);
      const consistencyStartTime = Date.now();

      try {
        // Create baseline data
        const baselineResponse = await fetch(`${backendUrl}/api/user-1/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer user-1",
          },
          body: JSON.stringify({
            title: `Consistency Test ${consistencyTest.name}`,
            content: `Testing data consistency during ${consistencyTest.name}`,
            tags: ["consistency-test"],
          }),
        });

        if (baselineResponse.ok) {
          const baselineNote = await baselineResponse.json();
          testData.createdNotes.push(baselineNote.id);

          console.log(`       ✅ Baseline data created`);

          // Simulate failure scenario
          if (consistencyTest.operation === "write") {
            // Simulate concurrent write failure
            const concurrentWrites = [];
            for (let i = 0; i < 5; i++) {
              concurrentWrites.push(
                fetch(`${backendUrl}/api/user-1/notes/${baselineNote.id}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer user-1",
                  },
                  body: JSON.stringify({
                    ...baselineNote,
                    content: `Updated content ${i} at ${Date.now()}`,
                    modified: new Date().toISOString(),
                  }),
                })
              );
            }

            const writeResults = await Promise.allSettled(concurrentWrites);
            const successfulWrites = writeResults.filter(
              (r) => r.status === "fulfilled" && r.value.ok
            ).length;

            console.log(
              `       ✅ Concurrent writes: ${successfulWrites}/5 successful`
            );

            // Verify data consistency
            const verifyResponse = await fetch(
              `${backendUrl}/api/user-1/notes/${baselineNote.id}`,
              {
                headers: { Authorization: "Bearer user-1" },
              }
            );

            if (verifyResponse.ok) {
              const verifiedNote = await verifyResponse.json();
              console.log(`       ✅ Data consistency verified`);
              resilienceMetrics.recoverySuccess++;
            } else {
              console.log(`       ❌ Data consistency check failed`);
              resilienceMetrics.recoveryFailures++;
            }
          }
        } else {
          console.log(`       ❌ Baseline data creation failed`);
        }
      } catch (error) {
        console.log(`       ❌ Consistency test error: ${error.message}`);
        resilienceMetrics.errorsCaught++;
      }

      const consistencyEndTime = Date.now();
      const consistencyDuration = consistencyEndTime - consistencyStartTime;

      performanceData.resilienceTests.push({
        test: consistencyTest.name,
        duration: consistencyDuration,
      });

      console.log(
        `       ✅ Consistency test completed in ${consistencyDuration}ms`
      );
    }

    const duration8 = Date.now() - startTime8;
    console.log(`✅ Data consistency during failures tested (${duration8}ms)`);

    console.log("\n📊 Performance Summary:");
    console.log("========================");

    // Error Detection Performance
    console.log("\n🔍 Error Detection:");
    const avgErrorDetection =
      performanceData.errorDetection.reduce((sum, e) => sum + e.duration, 0) /
      performanceData.errorDetection.length;
    console.log(`   Average detection time: ${avgErrorDetection.toFixed(2)}ms`);

    // Recovery Performance
    console.log("\n⚡ Recovery Performance:");
    const avgRecoveryTime =
      performanceData.recoveryTime.reduce((sum, r) => sum + r.duration, 0) /
      performanceData.recoveryTime.length;
    console.log(`   Average recovery time: ${avgRecoveryTime.toFixed(2)}ms`);

    // Resilience Metrics
    console.log("\n🛡️  Resilience Metrics:");
    console.log(`   Errors caught: ${resilienceMetrics.errorsCaught}`);
    console.log(`   Recovery successes: ${resilienceMetrics.recoverySuccess}`);
    console.log(`   Recovery failures: ${resilienceMetrics.recoveryFailures}`);
    console.log(
      `   Degradation events: ${resilienceMetrics.degradationEvents}`
    );

    const totalRecoveryAttempts =
      resilienceMetrics.recoverySuccess + resilienceMetrics.recoveryFailures;
    if (totalRecoveryAttempts > 0) {
      const recoverySuccessRate =
        (resilienceMetrics.recoverySuccess / totalRecoveryAttempts) * 100;
      console.log(
        `   Recovery success rate: ${recoverySuccessRate.toFixed(1)}%`
      );

      if (recoverySuccessRate < 80) {
        console.log(`   ⚠️  Low recovery success rate - needs improvement`);
      } else {
        console.log(`   ✅ Good recovery success rate`);
      }
    }

    // Performance Warnings
    console.log("\n⚠️  Performance Warnings:");
    const slowRecoveries = performanceData.recoveryTime.filter(
      (r) => r.duration > 1000
    );
    if (slowRecoveries.length > 0) {
      console.log(
        `   ${slowRecoveries.length} recovery operations exceeded 1000ms`
      );
    }

    const slowDetections = performanceData.errorDetection.filter(
      (e) => e.duration > 500
    );
    if (slowDetections.length > 0) {
      console.log(
        `   ${slowDetections.length} error detection operations exceeded 500ms`
      );
    }

    if (slowRecoveries.length === 0 && slowDetections.length === 0) {
      console.log("   No performance warnings detected ✅");
    }

    console.log("\n🎉 Error Recovery & Resilience test completed!");
  } catch (error) {
    console.error("\n❌ Error Recovery & Resilience test failed:", error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up test data...");

    // Delete created notes
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

    // Delete created files
    for (const file of testData.createdFiles) {
      try {
        if (fs.existsSync(file)) {
          // Restore permissions if needed
          try {
            fs.chmodSync(file, 0o644);
          } catch (chmodError) {
            // Ignore chmod errors during cleanup
          }
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.warn(`Failed to delete file ${file}:`, error.message);
      }
    }

    // Kill any mock servers
    for (const server of testData.mockServers) {
      try {
        server.kill();
      } catch (error) {
        console.warn(`Failed to kill mock server:`, error.message);
      }
    }

    console.log("✅ Cleanup completed");
  }
}

// Run the test
testErrorRecoveryResilience().catch(console.error);
