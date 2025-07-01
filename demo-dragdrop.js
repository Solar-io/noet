#!/usr/bin/env node

/**
 * Drag and Drop Demo Script
 * Creates test data and demonstrates drag and drop functionality
 */

import configService from "./src/configService.js";

// Color codes
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  bright: "\x1b[1m",
};

const log = (color, message) => {
  console.log(`${color}${message}${colors.reset}`);
};

async function createDragDropDemoData() {
  try {
    const backendUrl = "http://localhost:3004"; // Default backend URL
    log(colors.cyan, `🔗 Using backend: ${backendUrl}`);

    const userId = "user-1"; // Demo user

    // Create demo notebooks
    const notebooks = [
      { name: "Work Projects", color: "#3b82f6" },
      { name: "Personal Notes", color: "#10b981" },
      { name: "Ideas & Inspiration", color: "#f59e0b" },
    ];

    // Create demo folders
    const folders = [
      { name: "Current Tasks", color: "#6366f1" },
      { name: "Archive", color: "#64748b" },
      { name: "Research", color: "#ec4899" },
    ];

    // Create demo tags
    const tags = [
      { name: "urgent", color: "#ef4444" },
      { name: "meeting", color: "#8b5cf6" },
      { name: "draft", color: "#f97316" },
      { name: "review", color: "#06b6d4" },
    ];

    // Create demo notes for drag and drop testing
    const notes = [
      {
        title: "Quarterly Planning Meeting",
        content: "Discussion points for Q4 planning session...",
        tags: ["meeting", "urgent"],
      },
      {
        title: "Project Alpha Requirements",
        content: "Technical requirements and specifications...",
        tags: ["draft"],
      },
      {
        title: "Marketing Campaign Ideas",
        content: "Creative concepts for next campaign...",
        tags: ["draft", "review"],
      },
      {
        title: "Team Retrospective Notes",
        content: "Key insights from team retrospective...",
        tags: ["meeting"],
      },
      {
        title: "API Documentation",
        content: "Comprehensive API reference and examples...",
        tags: ["review"],
      },
    ];

    log(
      colors.yellow,
      "\n🎭 Creating demo data for drag and drop testing...\n"
    );

    // Create notebooks
    for (const notebook of notebooks) {
      try {
        const response = await fetch(`${backendUrl}/api/${userId}/notebooks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notebook),
        });
        if (response.ok) {
          log(colors.green, `✅ Created notebook: ${notebook.name}`);
        }
      } catch (error) {
        log(colors.red, `❌ Failed to create notebook: ${notebook.name}`);
      }
    }

    // Create folders
    for (const folder of folders) {
      try {
        const response = await fetch(`${backendUrl}/api/${userId}/folders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(folder),
        });
        if (response.ok) {
          log(colors.green, `✅ Created folder: ${folder.name}`);
        }
      } catch (error) {
        log(colors.red, `❌ Failed to create folder: ${folder.name}`);
      }
    }

    // Create tags
    for (const tag of tags) {
      try {
        const response = await fetch(`${backendUrl}/api/${userId}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tag),
        });
        if (response.ok) {
          log(colors.green, `✅ Created tag: ${tag.name}`);
        }
      } catch (error) {
        log(colors.red, `❌ Failed to create tag: ${tag.name}`);
      }
    }

    // Create notes
    for (const note of notes) {
      try {
        const response = await fetch(`${backendUrl}/api/${userId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(note),
        });
        if (response.ok) {
          log(colors.green, `✅ Created note: ${note.title}`);
        }
      } catch (error) {
        log(colors.red, `❌ Failed to create note: ${note.title}`);
      }
    }

    log(colors.cyan + colors.bright, "\n🎯 DRAG AND DROP DEMO READY!");
    log(colors.cyan, "================================\n");

    console.log("Demo data created! Now you can test:");
    console.log("");
    console.log("📝 NOTE OPERATIONS:");
    console.log("  • Drag notes to reorder them in the list");
    console.log("  • Drop notebooks from sidebar onto notes");
    console.log("  • Drop folders from sidebar onto notes");
    console.log("  • Drop tags from sidebar onto notes");
    console.log("");
    console.log("📚 SIDEBAR OPERATIONS:");
    console.log("  • Drag notebooks between folders");
    console.log("  • Reorder folders by dragging them");
    console.log("  • Reorder tags by dragging them");
    console.log("");
    console.log("🎨 VISUAL FEEDBACK:");
    console.log("  • Blue highlights for note drop zones");
    console.log("  • Green highlights for notebook drops");
    console.log("  • Yellow highlights for tag drops");
    console.log("  • Drop indicators show valid targets");

    log(colors.green, "\n🚀 Open http://localhost:3000 to start testing!");
  } catch (error) {
    log(colors.red, `❌ Error creating demo data: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createDragDropDemoData();
}

export { createDragDropDemoData };
