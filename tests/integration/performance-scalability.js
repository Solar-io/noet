/**
 * Test Script: Performance & Scalability Testing
 *
 * This script tests performance and scalability including large dataset handling,
 * memory usage monitoring, database query performance, and pagination efficiency.
 */

import configService from "../../src/configService.js";
import { performance } from "perf_hooks";

async function testPerformanceScalability() {
  console.log("🚀 Testing Performance & Scalability...\n");

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
    createdUsers: [],
    createdTags: [],
    largeDatasets: [],
  };

  // Performance metrics
  const performanceMetrics = {
    queryTimes: [],
    memoryUsage: [],
    cpuUsage: [],
    concurrentRequests: [],
    bulkOperations: [],
    paginationTimes: [],
    searchTimes: [],
  };

  // Scalability benchmarks
  const scalabilityBenchmarks = {
    "10_notes": { target: 50, actual: [] },
    "100_notes": { target: 200, actual: [] },
    "1000_notes": { target: 1000, actual: [] },
    "10000_notes": { target: 5000, actual: [] },
    concurrent_users: { target: 100, actual: [] },
    bulk_operations: { target: 500, actual: [] },
  };

  // Memory tracking
  const memoryTracker = {
    initial: process.memoryUsage(),
    peak: process.memoryUsage(),
    snapshots: [],
  };

  try {
    // Test 1: Large Dataset Creation and Handling
    console.log("📊 Test 1: Large Dataset Creation and Handling...");
    const startTime1 = performance.now();

    // Create datasets of increasing size
    const datasetSizes = [10, 100, 1000];

    for (const size of datasetSizes) {
      console.log(`\n   Creating dataset of ${size} notes...`);
      const datasetStartTime = performance.now();

      // Batch create notes
      const batchSize = 50;
      const batches = Math.ceil(size / batchSize);

      for (let batch = 0; batch < batches; batch++) {
        const batchStartTime = performance.now();
        const promises = [];

        const notesInBatch = Math.min(batchSize, size - batch * batchSize);

        for (let i = 0; i < notesInBatch; i++) {
          const noteIndex = batch * batchSize + i;
          promises.push(
            fetch(`${backendUrl}/api/user-1/notes`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer user-1",
              },
              body: JSON.stringify({
                title: `Performance Test Note ${noteIndex + 1}`,
                content: `This is performance test content for note ${
                  noteIndex + 1
                }. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
                tags: [
                  `perf-test`,
                  `size-${size}`,
                  `batch-${batch}`,
                  `note-${noteIndex}`,
                ],
              }),
            })
          );
        }

        const batchResults = await Promise.allSettled(promises);
        const batchEndTime = performance.now();
        const batchDuration = batchEndTime - batchStartTime;

        // Track successful creations
        let successful = 0;
        for (const result of batchResults) {
          if (result.status === "fulfilled" && result.value.ok) {
            successful++;
            const note = await result.value.json();
            testData.createdNotes.push(note.id);
          }
        }

        performanceMetrics.bulkOperations.push(batchDuration);
        console.log(
          `     Batch ${
            batch + 1
          }/${batches}: ${successful}/${notesInBatch} notes created in ${batchDuration.toFixed(
            2
          )}ms`
        );

        // Memory snapshot
        const memSnapshot = process.memoryUsage();
        memoryTracker.snapshots.push({
          timestamp: Date.now(),
          size: size,
          batch: batch,
          memory: memSnapshot,
        });

        // Update peak memory usage
        if (memSnapshot.heapUsed > memoryTracker.peak.heapUsed) {
          memoryTracker.peak = memSnapshot;
        }
      }

      const datasetEndTime = performance.now();
      const datasetDuration = datasetEndTime - datasetStartTime;

      // Record benchmark
      const benchmarkKey = `${size}_notes`;
      if (scalabilityBenchmarks[benchmarkKey]) {
        scalabilityBenchmarks[benchmarkKey].actual.push(datasetDuration);

        if (datasetDuration > scalabilityBenchmarks[benchmarkKey].target) {
          console.log(
            `⚠️  Performance warning: ${size} notes took ${datasetDuration.toFixed(
              2
            )}ms (target: ${scalabilityBenchmarks[benchmarkKey].target}ms)`
          );
        } else {
          console.log(
            `✅ Performance target met: ${size} notes in ${datasetDuration.toFixed(
              2
            )}ms`
          );
        }
      }
    }

    const duration1 = performance.now() - startTime1;
    console.log(`✅ Large dataset creation tested (${duration1.toFixed(2)}ms)`);

    // Test 2: Query Performance Analysis
    console.log("\n🔍 Test 2: Query Performance Analysis...");
    const startTime2 = performance.now();

    // Test different query patterns
    const queryTests = [
      { name: "Get All Notes", endpoint: "/api/user-1/notes" },
      { name: "Get Notes with Limit", endpoint: "/api/user-1/notes?limit=100" },
      {
        name: "Get Notes with Offset",
        endpoint: "/api/user-1/notes?limit=50&offset=100",
      },
      {
        name: "Get Notes by Tag",
        endpoint: "/api/user-1/notes?tags=perf-test",
      },
      {
        name: "Search Notes",
        endpoint: "/api/user-1/notes/search?q=Performance",
      },
      {
        name: "Get Single Note",
        endpoint: `/api/user-1/notes/${testData.createdNotes[0]}`,
      },
    ];

    for (const queryTest of queryTests) {
      const queryStartTime = performance.now();

      const response = await fetch(`${backendUrl}${queryTest.endpoint}`, {
        headers: { Authorization: "Bearer user-1" },
      });

      const queryEndTime = performance.now();
      const queryDuration = queryEndTime - queryStartTime;

      performanceMetrics.queryTimes.push({
        test: queryTest.name,
        duration: queryDuration,
        success: response.ok,
      });

      if (response.ok) {
        const data = await response.json();
        const resultCount = Array.isArray(data) ? data.length : 1;
        console.log(
          `✅ ${queryTest.name}: ${queryDuration.toFixed(
            2
          )}ms (${resultCount} results)`
        );

        if (queryDuration > 100) {
          console.log(
            `⚠️  Performance warning: ${queryTest.name} exceeded 100ms threshold`
          );
        }
      } else {
        console.log(`❌ ${queryTest.name}: Query failed`);
      }
    }

    const duration2 = performance.now() - startTime2;
    console.log(`✅ Query performance tested (${duration2.toFixed(2)}ms)`);

    // Test 3: Pagination Efficiency
    console.log("\n📄 Test 3: Pagination Efficiency...");
    const startTime3 = performance.now();

    // Test pagination with different page sizes
    const pageSizes = [10, 50, 100, 200];

    for (const pageSize of pageSizes) {
      console.log(`\n   Testing pagination with page size ${pageSize}...`);

      const paginationStartTime = performance.now();
      let currentPage = 0;
      let totalFetched = 0;
      let hasMore = true;

      while (hasMore && currentPage < 5) {
        // Limit to 5 pages for testing
        const pageStartTime = performance.now();

        const response = await fetch(
          `${backendUrl}/api/user-1/notes?limit=${pageSize}&offset=${
            currentPage * pageSize
          }`,
          {
            headers: { Authorization: "Bearer user-1" },
          }
        );

        const pageEndTime = performance.now();
        const pageDuration = pageEndTime - pageStartTime;

        if (response.ok) {
          const data = await response.json();
          totalFetched += data.length;
          hasMore = data.length === pageSize;

          performanceMetrics.paginationTimes.push({
            pageSize: pageSize,
            page: currentPage,
            duration: pageDuration,
            resultCount: data.length,
          });

          console.log(
            `     Page ${currentPage + 1}: ${
              data.length
            } notes in ${pageDuration.toFixed(2)}ms`
          );

          if (pageDuration > 50) {
            console.log(
              `⚠️  Page load time warning: ${pageDuration.toFixed(2)}ms`
            );
          }
        } else {
          console.log(`❌ Page ${currentPage + 1}: Request failed`);
          hasMore = false;
        }

        currentPage++;
      }

      const paginationEndTime = performance.now();
      const paginationDuration = paginationEndTime - paginationStartTime;

      console.log(
        `   Total: ${totalFetched} notes fetched in ${paginationDuration.toFixed(
          2
        )}ms`
      );

      // Calculate efficiency metrics
      const avgPageTime = paginationDuration / currentPage;
      const notesPerSecond = totalFetched / (paginationDuration / 1000);

      console.log(
        `   Efficiency: ${avgPageTime.toFixed(
          2
        )}ms/page, ${notesPerSecond.toFixed(2)} notes/second`
      );
    }

    const duration3 = performance.now() - startTime3;
    console.log(`✅ Pagination efficiency tested (${duration3.toFixed(2)}ms)`);

    // Test 4: Concurrent User Simulation
    console.log("\n👥 Test 4: Concurrent User Simulation...");
    const startTime4 = performance.now();

    // Simulate concurrent users
    const concurrentUsers = [5, 10, 25, 50];

    for (const userCount of concurrentUsers) {
      console.log(`\n   Simulating ${userCount} concurrent users...`);

      const concurrentStartTime = performance.now();
      const promises = [];

      for (let i = 0; i < userCount; i++) {
        // Each user performs a series of operations
        const userOperations = [
          // Get notes
          fetch(`${backendUrl}/api/user-1/notes?limit=50`, {
            headers: { Authorization: "Bearer user-1" },
          }),
          // Search
          fetch(`${backendUrl}/api/user-1/notes/search?q=test`, {
            headers: { Authorization: "Bearer user-1" },
          }),
          // Get tags
          fetch(`${backendUrl}/api/user-1/tags`, {
            headers: { Authorization: "Bearer user-1" },
          }),
        ];

        promises.push(Promise.all(userOperations));
      }

      const concurrentResults = await Promise.allSettled(promises);
      const concurrentEndTime = performance.now();
      const concurrentDuration = concurrentEndTime - concurrentStartTime;

      let successfulUsers = 0;
      let totalRequests = 0;
      let successfulRequests = 0;

      for (const result of concurrentResults) {
        if (result.status === "fulfilled") {
          successfulUsers++;
          totalRequests += result.value.length;
          successfulRequests += result.value.filter((r) => r.ok).length;
        }
      }

      performanceMetrics.concurrentRequests.push({
        userCount: userCount,
        duration: concurrentDuration,
        successfulUsers: successfulUsers,
        successRate: (successfulRequests / totalRequests) * 100,
      });

      console.log(
        `   Results: ${successfulUsers}/${userCount} users completed successfully`
      );
      console.log(`   Total time: ${concurrentDuration.toFixed(2)}ms`);
      console.log(
        `   Success rate: ${(
          (successfulRequests / totalRequests) *
          100
        ).toFixed(1)}%`
      );

      // Check if target is met
      if (
        scalabilityBenchmarks.concurrent_users &&
        concurrentDuration > scalabilityBenchmarks.concurrent_users.target
      ) {
        console.log(
          `⚠️  Performance warning: ${userCount} concurrent users exceeded target time`
        );
      } else {
        console.log(`✅ Concurrent users target met`);
      }
    }

    const duration4 = performance.now() - startTime4;
    console.log(
      `✅ Concurrent user simulation tested (${duration4.toFixed(2)}ms)`
    );

    // Test 5: Memory Usage Monitoring
    console.log("\n🧠 Test 5: Memory Usage Monitoring...");
    const startTime5 = performance.now();

    // Monitor memory during operations
    const memoryTests = [
      { name: "Bulk Note Creation", operation: "bulk_create" },
      { name: "Large Query Result", operation: "large_query" },
      { name: "Search Operations", operation: "search" },
      { name: "Concurrent Operations", operation: "concurrent" },
    ];

    for (const memTest of memoryTests) {
      console.log(`\n   Monitoring memory during ${memTest.name}...`);

      const beforeMemory = process.memoryUsage();
      const operationStartTime = performance.now();

      if (memTest.operation === "bulk_create") {
        // Create 100 notes rapidly
        const promises = [];
        for (let i = 0; i < 100; i++) {
          promises.push(
            fetch(`${backendUrl}/api/user-1/notes`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer user-1",
              },
              body: JSON.stringify({
                title: `Memory Test Note ${i + 1}`,
                content: `Memory test content ${i + 1}`,
                tags: ["memory-test"],
              }),
            })
          );
        }

        const results = await Promise.allSettled(promises);
        const successful = results.filter(
          (r) => r.status === "fulfilled" && r.value.ok
        ).length;

        // Add to cleanup
        for (const result of results) {
          if (result.status === "fulfilled" && result.value.ok) {
            const note = await result.value.json();
            testData.createdNotes.push(note.id);
          }
        }

        console.log(`     Created ${successful}/100 notes`);
      } else if (memTest.operation === "large_query") {
        // Query all notes
        const response = await fetch(`${backendUrl}/api/user-1/notes`, {
          headers: { Authorization: "Bearer user-1" },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`     Retrieved ${data.length} notes`);
        }
      } else if (memTest.operation === "search") {
        // Perform multiple searches
        const searchTerms = [
          "test",
          "performance",
          "memory",
          "note",
          "content",
        ];
        const searchPromises = searchTerms.map((term) =>
          fetch(`${backendUrl}/api/user-1/notes/search?q=${term}`, {
            headers: { Authorization: "Bearer user-1" },
          })
        );

        const searchResults = await Promise.allSettled(searchPromises);
        const successfulSearches = searchResults.filter(
          (r) => r.status === "fulfilled" && r.value.ok
        ).length;
        console.log(
          `     Completed ${successfulSearches}/${searchTerms.length} searches`
        );
      } else if (memTest.operation === "concurrent") {
        // Simulate concurrent operations
        const concurrentPromises = [];
        for (let i = 0; i < 20; i++) {
          concurrentPromises.push(
            fetch(`${backendUrl}/api/user-1/notes?limit=50`, {
              headers: { Authorization: "Bearer user-1" },
            })
          );
        }

        const concurrentResults = await Promise.allSettled(concurrentPromises);
        const successful = concurrentResults.filter(
          (r) => r.status === "fulfilled" && r.value.ok
        ).length;
        console.log(`     Completed ${successful}/20 concurrent requests`);
      }

      const afterMemory = process.memoryUsage();
      const operationEndTime = performance.now();
      const operationDuration = operationEndTime - operationStartTime;

      const memoryDelta = {
        heapUsed: afterMemory.heapUsed - beforeMemory.heapUsed,
        heapTotal: afterMemory.heapTotal - beforeMemory.heapTotal,
        external: afterMemory.external - beforeMemory.external,
        rss: afterMemory.rss - beforeMemory.rss,
      };

      performanceMetrics.memoryUsage.push({
        test: memTest.name,
        duration: operationDuration,
        memoryDelta: memoryDelta,
        peakMemory: afterMemory.heapUsed,
      });

      console.log(
        `     Memory delta: ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(
          2
        )}MB heap`
      );
      console.log(
        `     Peak memory: ${(afterMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`
      );
      console.log(`     Duration: ${operationDuration.toFixed(2)}ms`);

      // Check for memory leaks
      if (memoryDelta.heapUsed > 50 * 1024 * 1024) {
        // 50MB threshold
        console.log(
          `⚠️  Memory warning: ${memTest.name} used ${(
            memoryDelta.heapUsed /
            1024 /
            1024
          ).toFixed(2)}MB`
        );
      }
    }

    const duration5 = performance.now() - startTime5;
    console.log(
      `✅ Memory usage monitoring tested (${duration5.toFixed(2)}ms)`
    );

    // Test 6: Search Performance
    console.log("\n🔍 Test 6: Search Performance...");
    const startTime6 = performance.now();

    // Test search with different complexity
    const searchTests = [
      { name: "Single Term", query: "test" },
      { name: "Multiple Terms", query: "performance test note" },
      { name: "Quoted Phrase", query: '"performance test"' },
      { name: "Wildcard Search", query: "test*" },
      { name: "Tag Search", query: "tag:perf-test" },
      { name: "Complex Query", query: "performance AND (test OR note)" },
    ];

    for (const searchTest of searchTests) {
      console.log(`\n   Testing ${searchTest.name}: "${searchTest.query}"`);

      const searchStartTime = performance.now();

      const response = await fetch(
        `${backendUrl}/api/user-1/notes/search?q=${encodeURIComponent(
          searchTest.query
        )}`,
        {
          headers: { Authorization: "Bearer user-1" },
        }
      );

      const searchEndTime = performance.now();
      const searchDuration = searchEndTime - searchStartTime;

      if (response.ok) {
        const results = await response.json();
        const resultCount = Array.isArray(results) ? results.length : 0;

        performanceMetrics.searchTimes.push({
          test: searchTest.name,
          query: searchTest.query,
          duration: searchDuration,
          resultCount: resultCount,
        });

        console.log(
          `     Results: ${resultCount} notes found in ${searchDuration.toFixed(
            2
          )}ms`
        );

        if (searchDuration > 100) {
          console.log(
            `⚠️  Search performance warning: ${searchDuration.toFixed(2)}ms`
          );
        }
      } else {
        console.log(`❌ Search failed: ${searchTest.name}`);
      }
    }

    const duration6 = performance.now() - startTime6;
    console.log(`✅ Search performance tested (${duration6.toFixed(2)}ms)`);

    // Test 7: Bulk Operations Performance
    console.log("\n⚡ Test 7: Bulk Operations Performance...");
    const startTime7 = performance.now();

    // Test bulk operations
    const bulkTests = [
      { name: "Bulk Update", operation: "update", count: 100 },
      { name: "Bulk Delete", operation: "delete", count: 50 },
      { name: "Bulk Tag Assignment", operation: "tag_assign", count: 200 },
      { name: "Bulk Export", operation: "export", count: 1000 },
    ];

    for (const bulkTest of bulkTests) {
      console.log(`\n   Testing ${bulkTest.name} (${bulkTest.count} items)...`);

      const bulkStartTime = performance.now();

      if (bulkTest.operation === "update") {
        // Bulk update first 100 notes
        const notesToUpdate = testData.createdNotes.slice(0, bulkTest.count);
        const updatePromises = notesToUpdate.map((noteId) =>
          fetch(`${backendUrl}/api/user-1/notes/${noteId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer user-1",
            },
            body: JSON.stringify({
              title: `Updated Note ${noteId}`,
              content: `Updated content at ${new Date().toISOString()}`,
              tags: ["updated", "bulk-test"],
            }),
          })
        );

        const updateResults = await Promise.allSettled(updatePromises);
        const successfulUpdates = updateResults.filter(
          (r) => r.status === "fulfilled" && r.value.ok
        ).length;
        console.log(
          `     Updated ${successfulUpdates}/${bulkTest.count} notes`
        );
      } else if (bulkTest.operation === "delete") {
        // Bulk delete last 50 notes
        const notesToDelete = testData.createdNotes.slice(-bulkTest.count);
        const deletePromises = notesToDelete.map((noteId) =>
          fetch(`${backendUrl}/api/user-1/notes/${noteId}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer user-1" },
          })
        );

        const deleteResults = await Promise.allSettled(deletePromises);
        const successfulDeletes = deleteResults.filter(
          (r) => r.status === "fulfilled" && r.value.ok
        ).length;
        console.log(
          `     Deleted ${successfulDeletes}/${bulkTest.count} notes`
        );

        // Remove from cleanup list
        notesToDelete.forEach((noteId) => {
          const index = testData.createdNotes.indexOf(noteId);
          if (index > -1) {
            testData.createdNotes.splice(index, 1);
          }
        });
      } else if (bulkTest.operation === "tag_assign") {
        // Bulk tag assignment
        const notesToTag = testData.createdNotes.slice(0, bulkTest.count);
        const tagPromises = notesToTag.map((noteId) =>
          fetch(`${backendUrl}/api/user-1/notes/${noteId}/tags`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer user-1",
            },
            body: JSON.stringify({
              tags: ["bulk-tagged", "performance-test"],
            }),
          })
        );

        const tagResults = await Promise.allSettled(tagPromises);
        const successfulTags = tagResults.filter(
          (r) => r.status === "fulfilled" && r.value.ok
        ).length;
        console.log(`     Tagged ${successfulTags}/${bulkTest.count} notes`);
      } else if (bulkTest.operation === "export") {
        // Bulk export
        const exportResponse = await fetch(
          `${backendUrl}/api/user-1/export/json`,
          {
            headers: { Authorization: "Bearer user-1" },
          }
        );

        if (exportResponse.ok) {
          const exportData = await exportResponse.json();
          const exportedCount = exportData.notes ? exportData.notes.length : 0;
          console.log(`     Exported ${exportedCount} notes`);
        }
      }

      const bulkEndTime = performance.now();
      const bulkDuration = bulkEndTime - bulkStartTime;

      performanceMetrics.bulkOperations.push({
        test: bulkTest.name,
        operation: bulkTest.operation,
        count: bulkTest.count,
        duration: bulkDuration,
        itemsPerSecond: (bulkTest.count / (bulkDuration / 1000)).toFixed(2),
      });

      console.log(`     Completed in ${bulkDuration.toFixed(2)}ms`);
      console.log(
        `     Performance: ${(bulkTest.count / (bulkDuration / 1000)).toFixed(
          2
        )} items/second`
      );

      // Check performance targets
      if (
        scalabilityBenchmarks.bulk_operations &&
        bulkDuration > scalabilityBenchmarks.bulk_operations.target
      ) {
        console.log(
          `⚠️  Bulk operation performance warning: ${bulkDuration.toFixed(2)}ms`
        );
      }
    }

    const duration7 = performance.now() - startTime7;
    console.log(
      `✅ Bulk operations performance tested (${duration7.toFixed(2)}ms)`
    );

    // Test 8: Database Connection Pool Performance
    console.log("\n🔌 Test 8: Database Connection Pool Performance...");
    const startTime8 = performance.now();

    // Test connection pool under load
    const connectionTests = [
      { name: "Sequential Requests", count: 100, concurrent: false },
      { name: "Concurrent Requests", count: 50, concurrent: true },
      { name: "Burst Requests", count: 200, concurrent: true },
    ];

    for (const connTest of connectionTests) {
      console.log(
        `\n   Testing ${connTest.name} (${connTest.count} requests)...`
      );

      const connStartTime = performance.now();

      if (connTest.concurrent) {
        // Concurrent requests
        const promises = [];
        for (let i = 0; i < connTest.count; i++) {
          promises.push(
            fetch(`${backendUrl}/api/user-1/notes?limit=1`, {
              headers: { Authorization: "Bearer user-1" },
            })
          );
        }

        const results = await Promise.allSettled(promises);
        const successful = results.filter(
          (r) => r.status === "fulfilled" && r.value.ok
        ).length;
        console.log(
          `     Completed ${successful}/${connTest.count} concurrent requests`
        );
      } else {
        // Sequential requests
        let successful = 0;
        for (let i = 0; i < connTest.count; i++) {
          const response = await fetch(
            `${backendUrl}/api/user-1/notes?limit=1`,
            {
              headers: { Authorization: "Bearer user-1" },
            }
          );

          if (response.ok) {
            successful++;
          }
        }

        console.log(
          `     Completed ${successful}/${connTest.count} sequential requests`
        );
      }

      const connEndTime = performance.now();
      const connDuration = connEndTime - connStartTime;

      console.log(`     Total time: ${connDuration.toFixed(2)}ms`);
      console.log(
        `     Average per request: ${(connDuration / connTest.count).toFixed(
          2
        )}ms`
      );
      console.log(
        `     Requests per second: ${(
          connTest.count /
          (connDuration / 1000)
        ).toFixed(2)}`
      );
    }

    const duration8 = performance.now() - startTime8;
    console.log(
      `✅ Database connection pool tested (${duration8.toFixed(2)}ms)`
    );

    console.log("\n📊 Performance Summary:");
    console.log("========================");

    // Query Performance Summary
    console.log("\n🔍 Query Performance:");
    const queryTimes = performanceMetrics.queryTimes.filter((q) => q.success);
    if (queryTimes.length > 0) {
      const avgQueryTime =
        queryTimes.reduce((sum, q) => sum + q.duration, 0) / queryTimes.length;
      const slowQueries = queryTimes.filter((q) => q.duration > 100);
      console.log(`   Average query time: ${avgQueryTime.toFixed(2)}ms`);
      console.log(
        `   Slow queries (>100ms): ${slowQueries.length}/${queryTimes.length}`
      );

      if (slowQueries.length > 0) {
        console.log("   Slowest queries:");
        slowQueries.forEach((q) => {
          console.log(`     ${q.test}: ${q.duration.toFixed(2)}ms`);
        });
      }
    }

    // Memory Usage Summary
    console.log("\n🧠 Memory Usage:");
    const initialMemory = memoryTracker.initial.heapUsed / 1024 / 1024;
    const peakMemory = memoryTracker.peak.heapUsed / 1024 / 1024;
    const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    console.log(`   Initial: ${initialMemory.toFixed(2)}MB`);
    console.log(`   Peak: ${peakMemory.toFixed(2)}MB`);
    console.log(`   Current: ${currentMemory.toFixed(2)}MB`);
    console.log(
      `   Memory increase: ${(currentMemory - initialMemory).toFixed(2)}MB`
    );

    // Concurrent Performance Summary
    console.log("\n👥 Concurrent Performance:");
    performanceMetrics.concurrentRequests.forEach((cr) => {
      console.log(
        `   ${cr.userCount} users: ${cr.duration.toFixed(
          2
        )}ms (${cr.successRate.toFixed(1)}% success)`
      );
    });

    // Bulk Operations Summary
    console.log("\n⚡ Bulk Operations:");
    performanceMetrics.bulkOperations.forEach((bo) => {
      console.log(`   ${bo.test}: ${bo.itemsPerSecond} items/second`);
    });

    // Scalability Benchmarks
    console.log("\n🎯 Scalability Benchmarks:");
    Object.entries(scalabilityBenchmarks).forEach(([test, benchmark]) => {
      if (benchmark.actual.length > 0) {
        const avgActual =
          benchmark.actual.reduce((a, b) => a + b, 0) / benchmark.actual.length;
        const status = avgActual <= benchmark.target ? "✅" : "❌";
        console.log(
          `   ${test}: ${status} ${avgActual.toFixed(2)}ms (target: ${
            benchmark.target
          }ms)`
        );
      }
    });

    // Performance Warnings
    console.log("\n⚠️  Performance Warnings:");
    let warningCount = 0;

    // Check for slow operations
    const allDurations = [
      ...performanceMetrics.queryTimes.map((q) => q.duration),
      ...performanceMetrics.paginationTimes.map((p) => p.duration),
      ...performanceMetrics.searchTimes.map((s) => s.duration),
      ...performanceMetrics.bulkOperations.map((b) => b.duration),
    ];

    const slowOperations = allDurations.filter((d) => d > 100);
    if (slowOperations.length > 0) {
      console.log(
        `   ${slowOperations.length} operations exceeded 100ms threshold`
      );
      warningCount++;
    }

    // Check memory usage
    const memoryIncrease = currentMemory - initialMemory;
    if (memoryIncrease > 100) {
      console.log(
        `   High memory usage: ${memoryIncrease.toFixed(2)}MB increase`
      );
      warningCount++;
    }

    if (warningCount === 0) {
      console.log("   No performance warnings detected ✅");
    }

    console.log("\n🎉 Performance & Scalability test completed!");
  } catch (error) {
    console.error("\n❌ Performance & Scalability test failed:", error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up test data...");

    // Delete created notes in batches
    const batchSize = 50;
    const noteBatches = [];
    for (let i = 0; i < testData.createdNotes.length; i += batchSize) {
      noteBatches.push(testData.createdNotes.slice(i, i + batchSize));
    }

    for (const batch of noteBatches) {
      const deletePromises = batch.map((noteId) =>
        fetch(`${backendUrl}/api/user-1/notes/${noteId}`, {
          method: "DELETE",
          headers: { Authorization: "Bearer user-1" },
        }).catch((error) =>
          console.warn(`Failed to delete note ${noteId}:`, error.message)
        )
      );

      await Promise.allSettled(deletePromises);
    }

    console.log(
      `✅ Cleanup completed - ${testData.createdNotes.length} notes deleted`
    );
  }
}

// Run the test
testPerformanceScalability().catch(console.error);
