import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CodeBlock from "@tiptap/extension-code-block";
import Blockquote from "@tiptap/extension-blockquote";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Heading from "@tiptap/extension-heading";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Strike from "@tiptap/extension-strike";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Image as ImageIcon,
  Save,
  Settings,
  FolderOpen,
  Download,
  Upload,
  Paperclip,
  FileText,
  X,
  Eye,
  Code,
  Quote,
  Highlighter,
  Strikethrough,
  Palette,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Subscript as SubIcon,
  Superscript as SupIcon,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import ComprehensiveColorPicker from "./components/ComprehensiveColorPicker.jsx";
import FileViewer from "./components/FileViewer.jsx";
import configService from "./configService.js";

// Initialize markdown converter
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});
turndownService.use(gfm);

// Custom ListItem extension to prevent paragraph wrapping (fixes double-line issue)
const CustomListItem = ListItem.extend({
  name: "listItem",
  content: "inline*",

  parseHTML() {
    return [
      {
        tag: "li",
        // Only match li elements that are NOT task items
        getAttrs: (node) => {
          if (
            node.hasAttribute("data-type") &&
            node.getAttribute("data-type") === "taskItem"
          ) {
            return false; // Don't match task items
          }
          if (node.hasAttribute("data-checked")) {
            return false; // Don't match task items
          }
          if (node.classList.contains("task-item")) {
            return false; // Don't match task items
          }
          return {}; // Match regular list items
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["li", HTMLAttributes, 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        // Handle Enter key in lists properly
        if (this.editor.isActive("listItem")) {
          return this.editor.commands.splitListItem("listItem");
        }
        return false;
      },
      Tab: () => {
        // Handle Tab for nesting lists
        if (this.editor.isActive("listItem")) {
          return this.editor.commands.sinkListItem("listItem");
        }
        return false;
      },
      "Shift-Tab": () => {
        // Handle Shift-Tab for lifting lists
        if (this.editor.isActive("listItem")) {
          return this.editor.commands.liftListItem("listItem");
        }
        return false;
      },
    };
  },
});

// TipTap Editor Component
const TipTapEditor = ({
  note,
  onSave,
  onContentChange,
  userId,
  availableTags = [],
  onTagsUpdate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState(note?.attachments || []);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({
    x: 0,
    y: 0,
  });
  const [viewingAttachment, setViewingAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Helper function to safely get/set custom storage
  const getEditorNoteId = (editor) => {
    try {
      return (
        editor?.storage?.currentNoteId || editor?._customStorage?.currentNoteId
      );
    } catch {
      return editor?._customStorage?.currentNoteId;
    }
  };

  const setEditorNoteId = (editor, noteId) => {
    try {
      if (editor.storage && typeof editor.storage === "object") {
        // Try to set on storage if possible
        if ("currentNoteId" in editor.storage) {
          editor.storage.currentNoteId = noteId;
          return;
        }
      }
    } catch (error) {
      console.warn("Could not set editor storage, using fallback:", error);
    }

    // Fallback: use custom storage
    editor._customStorage = { ...editor._customStorage, currentNoteId: noteId };
  };

  // Smart auto-save functionality with configurable timing and change detection
  const [lastSavedContent, setLastSavedContent] = useState(note?.content || "");
  const [autoSaveConfig, setAutoSaveConfig] = useState({
    autoSaveDelayMs: 10000, // Default 10 seconds
    minChangePercentage: 5, // Default 5% change
  });

  // Load auto-save configuration from backend
  useEffect(() => {
    const loadAutoSaveConfig = async () => {
      try {
        const backendUrl = await configService.getBackendUrl();
        const response = await fetch(
          `${backendUrl}/api/admin/config/auto-save`
        );

        // Handle 401 Unauthorized - use defaults (expected for non-admin users)
        if (response.status === 401) {
          console.log(
            "ℹ️ Auto-save config requires admin access, using defaults"
          );
          return;
        }

        if (response.ok) {
          const config = await response.json();
          setAutoSaveConfig({
            autoSaveDelayMs: config.autoSaveDelayMs || 10000,
            minChangePercentage: config.minChangePercentage || 5,
          });
          console.log("📋 Loaded auto-save config:", config);
        } else {
          console.warn(
            "⚠️ Failed to load auto-save config:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        // Network errors are common during app startup - use defaults silently
        if (error.message.includes("Failed to fetch")) {
          console.log(
            "ℹ️ Auto-save config unavailable (network), using defaults"
          );
        } else {
          console.warn(
            "⚠️ Failed to load auto-save config, using defaults:",
            error.message
          );
        }
      }
    };
    loadAutoSaveConfig();
  }, []);

  // Update last saved content when note changes
  useEffect(() => {
    if (note?.content) {
      setLastSavedContent(note.content);
    }
  }, [note?.id]); // Only update when switching to different note

  const smartAutoSave = async () => {
    if (!note || !editor || !userId) return;

    try {
      const currentContent = editor.getHTML();
      const markdown = turndownService.turndown(currentContent);

      // Check if content has actually changed
      if (currentContent === lastSavedContent) {
        console.log("⏭️ Auto-save skipped: No changes detected");
        return;
      }

      // Calculate content change percentage
      const oldLength = lastSavedContent.length || 1;
      const newLength = currentContent.length;
      const changePercentage =
        (Math.abs(newLength - oldLength) / oldLength) * 100;

      // Only save if change exceeds threshold or is first save
      if (
        changePercentage < autoSaveConfig.minChangePercentage &&
        lastSavedContent
      ) {
        console.log(
          `⏭️ Auto-save skipped: Change ${changePercentage.toFixed(
            1
          )}% < threshold ${autoSaveConfig.minChangePercentage}%`
        );
        return;
      }

      // Get backend URL
      const backendUrl = await configService.getBackendUrl();

      // Smart save with change detection
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${note.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: note.title,
            content: currentContent,
            markdown,
            tags: note.tags,
            notebook: note.notebook,
            folder: note.folder,
          }),
        }
      );

      if (response.ok) {
        console.log(
          `💾 Smart auto-save successful: ${changePercentage.toFixed(
            1
          )}% change in "${note.title}"`
        );
        setLastSavedContent(currentContent); // Update saved content reference

        // Call parent's onSave if provided
        onSave?.({
          ...note,
          content: currentContent,
          markdown,
        });
      } else {
        console.error("❌ Smart auto-save failed:", response.statusText);
      }
    } catch (error) {
      console.error("❌ Smart auto-save error:", error);
    }
  };

  const triggerAutoSave = async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Configurable delay with smart change detection
    autoSaveTimeoutRef.current = setTimeout(async () => {
      await smartAutoSave();
    }, autoSaveConfig.autoSaveDelayMs);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable StarterKit's built-in extensions that we're customizing
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        strike: false,
        history: {
          depth: 100,
        },
      }),
      // List extensions - ORDER MATTERS! Put regular lists before task lists
      BulletList.configure({
        keepMarks: true,
        keepAttributes: false,
        HTMLAttributes: {
          class: "bullet-list",
        },
      }),
      OrderedList.configure({
        keepMarks: true,
        keepAttributes: false,
        HTMLAttributes: {
          class: "ordered-list",
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: "list-item",
        },
      }),
      // Task list extensions AFTER regular lists
      TaskList.configure({
        HTMLAttributes: {
          class: "task-list",
        },
        itemTypeName: "taskItem", // Ensure it uses the correct item type
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "task-item",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "editor-link",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      // Advanced text formatting
      TextStyle.configure({
        HTMLAttributes: {
          class: "text-style",
        },
      }),
      Color.configure({
        types: ["textStyle"],
      }),
      FontFamily.configure({
        types: ["textStyle"],
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: "editor-highlight",
        },
      }),
      Strike.configure({
        HTMLAttributes: {
          class: "editor-strike",
        },
      }),
      Subscript.configure({
        HTMLAttributes: {
          class: "editor-subscript",
        },
      }),
      Superscript.configure({
        HTMLAttributes: {
          class: "editor-superscript",
        },
      }),
      // Block elements
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
        HTMLAttributes: {
          class: "editor-heading",
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: "editor-blockquote",
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: "editor-code-block",
        },
      }),
      HorizontalRule.configure({
        HTMLAttributes: {
          class: "editor-hr",
        },
      }),
    ],
    content: note?.content || "<p>Start writing your note...</p>",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);

      // Debug: Check for double-line list issues
      const listItems = editor.view.dom.querySelectorAll("li");
      const problematicItems = Array.from(listItems).filter((li) => {
        const paragraphs = li.querySelectorAll("p");
        return (
          paragraphs.length > 1 ||
          (paragraphs.length === 1 && paragraphs[0].parentNode === li)
        );
      });

      if (problematicItems.length > 0) {
        console.warn(
          "🚨 Found list items with paragraph wrapping:",
          problematicItems.length
        );
        problematicItems.forEach((item, index) => {
          console.warn(`Item ${index + 1}:`, item.innerHTML);
        });
      } else {
        console.log(
          "✅ All list items are properly formatted (no double-line issues)"
        );
      }

      // Debug: Check list structure and CSS classes
      const bulletLists = editor.view.dom.querySelectorAll("ul");
      const numberedLists = editor.view.dom.querySelectorAll("ol");

      if (bulletLists.length > 0) {
        console.log("🔍 Bullet lists found:", bulletLists.length);
        bulletLists.forEach((list, index) => {
          console.log(`Bullet list ${index + 1}:`, {
            classList: Array.from(list.classList),
            style: list.style.cssText,
            computedStyle: window.getComputedStyle(list).listStyleType,
            innerHTML: list.innerHTML,
            dataType: list.getAttribute("data-type"),
            isTaskList: list.getAttribute("data-type") === "taskList",
            listItems: Array.from(list.querySelectorAll("li")).map((li) => ({
              className: li.className,
              dataType: li.getAttribute("data-type"),
              dataChecked: li.getAttribute("data-checked"),
              hasCheckbox: li.querySelector('input[type="checkbox"]') !== null,
              isTaskItem:
                li.classList.contains("task-item") ||
                li.getAttribute("data-type") === "taskItem",
            })),
          });
        });
      }

      if (numberedLists.length > 0) {
        console.log("🔍 Numbered lists found:", numberedLists.length);
        numberedLists.forEach((list, index) => {
          console.log(`Numbered list ${index + 1}:`, {
            classList: Array.from(list.classList),
            style: list.style.cssText,
            computedStyle: window.getComputedStyle(list).listStyleType,
            innerHTML: list.innerHTML,
            dataType: list.getAttribute("data-type"),
            isTaskList: list.getAttribute("data-type") === "taskList",
            listItems: Array.from(list.querySelectorAll("li")).map((li) => ({
              className: li.className,
              dataType: li.getAttribute("data-type"),
              dataChecked: li.getAttribute("data-checked"),
              hasCheckbox: li.querySelector('input[type="checkbox"]') !== null,
              isTaskItem:
                li.classList.contains("task-item") ||
                li.getAttribute("data-type") === "taskItem",
            })),
          });
        });
      }

      onContentChange?.(note, html, markdown);
      triggerAutoSave(); // Trigger auto-save on content change
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
      },
      handleDrop: (view, event, slice, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();

            // Check file size
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (file.size > maxSize) {
              alert("Image file too large. Please choose a file under 100MB.");
              return true;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
              const imageUrl = e.target?.result;
              if (imageUrl) {
                const { schema } = view.state;
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });
                if (coordinates) {
                  const node = schema.nodes.image.create({
                    src: imageUrl,
                    alt: file.name,
                    title: file.name,
                  });
                  const transaction = view.state.tr.insert(
                    coordinates.pos,
                    node
                  );
                  view.dispatch(transaction);
                }
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handleDragOver: (view, event) => {
        if (
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            view.dom.classList.add("drag-over");
            return true;
          }
        }
        return false;
      },
      handleDragLeave: (view) => {
        view.dom.classList.remove("drag-over");
      },
    },
  });

  // Debug: Track when note prop changes
  useEffect(() => {
    console.log("🔍 TipTap component received new note prop:", {
      noteId: note?.id,
      noteTitle: note?.title,
      tempVersionPreview: note?.tempVersionPreview,
      previewingVersion: note?.previewingVersion,
      contentLength: note?.content?.length,
      contentPreview:
        note?.content?.substring(0, 50) +
        (note?.content?.length > 50 ? "..." : ""),
    });
  }, [note]);

  // Update attachments when note changes
  useEffect(() => {
    setAttachments(note?.attachments || []);
  }, [note]);

  // Update editor content when note changes (only when switching notes or versions, not during editing)
  useEffect(() => {
    console.log("🔍 TipTap useEffect triggered:", {
      hasEditor: !!editor,
      hasNote: !!note,
      noteId: note?.id,
      noteTitle: note?.title,
      tempVersionPreview: note?.tempVersionPreview,
      previewingVersion: note?.previewingVersion,
      contentLength: note?.content?.length,
    });

    if (editor && note && note.id) {
      const newContent = note.content || "<p>Start writing your note...</p>";
      const currentContent = editor.getHTML();

      // Only update if this is a different note (by ID) or a version switch
      // NEVER update during normal typing to prevent cursor jumps
      const currentNoteId = getEditorNoteId(editor);
      const isNewNote = currentNoteId !== note.id;
      const isVersionSwitch = note.tempVersionPreview; // Check if this is a version switch
      const hasSignificantChange =
        currentContent !== newContent &&
        (currentContent === "<p>Start writing your note...</p>" ||
          currentContent === "<p></p>" ||
          !currentContent.trim());

      console.log("🔍 TipTap content update check:", {
        isNewNote,
        isVersionSwitch,
        hasSignificantChange,
        currentNoteId,
        noteId: note.id,
        tempVersionPreview: note.tempVersionPreview,
        previewingVersion: note.previewingVersion,
        currentContentLength: currentContent?.length,
        newContentLength: newContent?.length,
        contentsEqual: currentContent === newContent,
      });

      // ONLY update for note switches or version switches - NEVER during normal typing
      if (isNewNote || isVersionSwitch || hasSignificantChange) {
        console.log("📝 Updating TipTap editor content:", {
          isNewNote,
          isVersionSwitch,
          hasSignificantChange,
          previewingVersion: note.previewingVersion,
          noteTitle: note.title,
          newContent:
            newContent.substring(0, 100) +
            (newContent.length > 100 ? "..." : ""),
        });

        // Force clear and set content for version switches to ensure update
        if (isVersionSwitch) {
          console.log("🔄 Force updating TipTap content for version switch");
          // Destroy and recreate the editor content to ensure a clean update
          editor.commands.clearContent(false);
          // Use requestAnimationFrame to ensure DOM update
          requestAnimationFrame(() => {
            editor.commands.setContent(newContent, false, {
              preserveWhitespace: true,
            });
            editor.commands.focus("end");
            console.log("✅ Version content set successfully");
          });
        } else {
          editor.commands.setContent(newContent);
        }

        setEditorNoteId(editor, note.id);
        console.log("✅ TipTap editor content updated for note:", note.title);
      } else {
        console.log(
          "⏭️ Skipping TipTap content update - normal typing detected"
        );
      }
    } else {
      console.log("⚠️ TipTap useEffect - missing editor, note, or note.id");
    }
  }, [
    editor,
    note?.id,
    note?.tempVersionPreview,
    note?.previewingVersion,
    note?.content,
  ]); // Added note?.previewingVersion and note?.content for version switches

  // Cleanup auto-save timeout on unmount and add beforeunload protection
  useEffect(() => {
    // Add beforeunload listener to save when user tries to close browser/tab
    const handleBeforeUnload = async (event) => {
      if (note && editor && userId) {
        // Cancel any pending auto-save
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        // Force save before page unload (bypass change threshold for safety)
        const currentContent = editor.getHTML();
        if (currentContent !== lastSavedContent) {
          console.log("🚪 BeforeUnload: Forcing save of unsaved changes");
          try {
            const markdown = turndownService.turndown(currentContent);
            const backendUrl = await configService.getBackendUrl();

            // Use fetch for synchronous save on page unload
            const response = await fetch(
              `${backendUrl}/api/${userId}/notes/${note.id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: note.title,
                  content: currentContent,
                  markdown,
                  tags: note.tags,
                  notebook: note.notebook,
                  folder: note.folder,
                }),
                keepalive: true, // Keep request alive during page unload
              }
            );

            if (response.ok) {
              console.log("✅ BeforeUnload save successful");
            }
          } catch (error) {
            console.error("❌ BeforeUnload save failed:", error);
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Cleanup timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Remove beforeunload listener
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [note, editor, userId]); // Dependencies needed for beforeunload handler

  // Debug helper - log editor state and create global test function
  useEffect(() => {
    if (editor) {
      // Log editor state when trying to create lists
      const logEditorState = () => {
        console.log("🔍 Editor state:", {
          isEmpty: editor.isEmpty,
          isActive: {
            bulletList: editor.isActive("bulletList"),
            orderedList: editor.isActive("orderedList"),
            taskList: editor.isActive("taskList"),
            listItem: editor.isActive("listItem"),
          },
          selection: editor.state.selection,
          content: editor.getHTML(),
        });
      };

      // Create global test function for browser console debugging
      window.testListRendering = () => {
        console.log("🧪 Testing list rendering...");
        logEditorState();

        // Test bullet list creation
        console.log("🔘 Testing bullet list creation...");
        const bulletResult = editor
          .chain()
          .focus()
          .insertContent({
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Test bullet item" }],
                  },
                ],
              },
            ],
          })
          .run();
        console.log("🔘 Bullet list creation result:", bulletResult);

        setTimeout(() => {
          console.log("🔘 After bullet list creation:");
          logEditorState();

          // Test task list creation
          console.log("☑️ Testing task list creation...");
          const taskResult = editor
            .chain()
            .focus()
            .insertContent({
              type: "taskList",
              content: [
                {
                  type: "taskItem",
                  attrs: {
                    checked: false,
                  },
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Test task item" }],
                    },
                  ],
                },
              ],
            })
            .run();
          console.log("☑️ Task list creation result:", taskResult);

          setTimeout(() => {
            console.log("☑️ After task list creation:");
            logEditorState();
          }, 100);
        }, 100);
      };

      // Notify about global test function
      console.log(
        "🔧 TipTap Editor Debug: Use `window.testListRendering()` in console to test list creation"
      );

      // Log state after each update
      editor.on("update", logEditorState);

      return () => {
        editor.off("update", logEditorState);
        // Clean up global function
        if (window.testListRendering) {
          delete window.testListRendering;
        }
      };
    }
  }, [editor]);

  // Helper function to validate list creation
  const validateListCreation = (listType) => {
    if (!editor) return false;

    // Check if TipTap thinks the list is active
    const isActive = editor.isActive(listType);

    // Check if the list actually exists in the DOM
    let listTag, domLists;
    if (listType === "bulletList") {
      listTag = "ul";
      domLists = editor.view.dom.querySelectorAll(
        "ul:not([data-type='taskList'])"
      );
    } else if (listType === "orderedList") {
      listTag = "ol";
      domLists = editor.view.dom.querySelectorAll(
        "ol:not([data-type='taskList'])"
      );
    } else if (listType === "taskList") {
      listTag = "ul[data-type='taskList']";
      domLists = editor.view.dom.querySelectorAll("ul[data-type='taskList']");
    }

    const hasDomList = domLists.length > 0;

    console.log(`🔍 Validating ${listType} creation:`, {
      isActive,
      hasDomList,
      domListCount: domLists.length,
      listTag,
    });

    return isActive && hasDomList;
  };

  // Helper function to create a list when toggle fails
  const forceCreateList = (listType) => {
    if (!editor) return false;

    console.log(`🔧 Force creating ${listType} list`);

    try {
      // Clear selection and focus
      editor.commands.focus();

      // Insert a new paragraph if editor is empty
      if (editor.isEmpty) {
        editor.commands.insertContent("<p></p>");
      }

      // Build the content structure based on list type
      let contentStructure;
      if (listType === "taskList") {
        contentStructure = {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: {
                checked: false,
              },
              content: [
                {
                  type: "paragraph",
                  content: [],
                },
              ],
            },
          ],
        };
      } else {
        contentStructure = {
          type: listType,
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [],
                },
              ],
            },
          ],
        };
      }

      // Insert the list structure
      const result = editor
        .chain()
        .focus()
        .insertContent(contentStructure)
        .run();

      console.log(`🔧 Force create ${listType} result:`, result);

      // Validate the creation
      setTimeout(() => {
        const isValid = validateListCreation(listType);
        console.log(`🔧 Force create ${listType} validation:`, isValid);
      }, 100);

      return result;
    } catch (error) {
      console.error(`❌ Failed to force create ${listType}:`, error);
      return false;
    }
  };

  // Toolbar actions
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleBulletList = () => {
    console.log("🔘 toggleBulletList clicked", {
      isActive: editor?.isActive("bulletList"),
      isTaskList: editor?.isActive("taskList"),
      selection: editor?.state.selection,
      isEmpty: editor?.isEmpty,
    });

    if (!editor) return;

    const { selection } = editor.state;
    const { $from, $to } = selection;

    // Check if we're already in a list
    if (editor.isActive("bulletList")) {
      console.log("🔘 Already in bullet list, lifting item");
      const result = editor.chain().focus().liftListItem("listItem").run();
      console.log("🔘 Lift result:", result);
      return;
    }

    // Get selected text or use empty string
    const text = editor.state.doc.textBetween($from.pos, $to.pos, " ");
    console.log("🔘 Selected text:", text);

    if (text.trim()) {
      // If there's selected text, convert it to a list
      console.log("🔘 Converting selected text to bullet list");
      const result = editor.chain().focus().toggleBulletList().run();
      console.log("🔘 Toggle result:", result);
    } else {
      // If no text selected, try standard toggle first
      console.log("🔘 No text selected, trying standard toggle");
      const result = editor.chain().focus().toggleBulletList().run();
      console.log("🔘 Standard toggle result:", result);

      // Check if list was created
      setTimeout(() => {
        if (!editor.isActive("bulletList")) {
          console.log("🔘 Standard toggle failed, trying direct insertion");
          // Try direct insertion first
          const insertResult = editor
            .chain()
            .focus()
            .insertContent({
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [],
                    },
                  ],
                },
              ],
            })
            .run();
          console.log("🔘 Direct insertion result:", insertResult);

          // If direct insertion also fails, try force create
          if (!insertResult) {
            console.log("🔘 Direct insertion failed, trying force create");
            forceCreateList("bulletList");
          }
        }
      }, 50);
    }

    // Check state after command
    setTimeout(() => {
      console.log("🔘 After toggleBulletList:", {
        isBulletListActive: editor?.isActive("bulletList"),
        isListItemActive: editor?.isActive("listItem"),
        currentSelection: editor?.state.selection,
        content: editor?.getHTML(),
      });
    }, 100);
  };
  const toggleOrderedList = () => {
    console.log("🔢 toggleOrderedList clicked", {
      isActive: editor?.isActive("orderedList"),
      isTaskList: editor?.isActive("taskList"),
      selection: editor?.state.selection,
      isEmpty: editor?.isEmpty,
    });

    if (!editor) return;

    const { selection } = editor.state;
    const { $from, $to } = selection;

    // Check if we're already in a list
    if (editor.isActive("orderedList")) {
      console.log("🔢 Already in ordered list, lifting item");
      const result = editor.chain().focus().liftListItem("listItem").run();
      console.log("🔢 Lift result:", result);
      return;
    }

    // Get selected text or use empty string
    const text = editor.state.doc.textBetween($from.pos, $to.pos, " ");
    console.log("🔢 Selected text:", text);

    if (text.trim()) {
      // If there's selected text, convert it to a list
      console.log("🔢 Converting selected text to ordered list");
      const result = editor.chain().focus().toggleOrderedList().run();
      console.log("🔢 Toggle result:", result);
    } else {
      // If no text selected, try standard toggle first
      console.log("🔢 No text selected, trying standard toggle");
      const result = editor.chain().focus().toggleOrderedList().run();
      console.log("🔢 Standard toggle result:", result);

      // Check if list was created
      setTimeout(() => {
        if (!editor.isActive("orderedList")) {
          console.log("🔢 Standard toggle failed, trying direct insertion");
          // Try direct insertion first
          const insertResult = editor
            .chain()
            .focus()
            .insertContent({
              type: "orderedList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [],
                    },
                  ],
                },
              ],
            })
            .run();
          console.log("🔢 Direct insertion result:", insertResult);

          // If direct insertion also fails, try force create
          if (!insertResult) {
            console.log("🔢 Direct insertion failed, trying force create");
            forceCreateList("orderedList");
          }
        }
      }, 50);
    }

    // Check state after command
    setTimeout(() => {
      console.log("🔢 After toggleOrderedList:", {
        isOrderedListActive: editor?.isActive("orderedList"),
        isListItemActive: editor?.isActive("listItem"),
        currentSelection: editor?.state.selection,
        content: editor?.getHTML(),
      });
    }, 100);
  };
  const toggleTaskList = () => {
    console.log("☑️ toggleTaskList clicked", {
      isActive: editor?.isActive("taskList"),
      isBulletList: editor?.isActive("bulletList"),
      isOrderedList: editor?.isActive("orderedList"),
      selection: editor?.state.selection,
      isEmpty: editor?.isEmpty,
    });

    if (!editor) return;

    const { selection } = editor.state;
    const { $from, $to } = selection;

    // Check if we're already in a task list
    if (editor.isActive("taskList")) {
      console.log("☑️ Already in task list, lifting item");
      const result = editor.chain().focus().liftListItem("taskItem").run();
      console.log("☑️ Lift result:", result);
      return;
    }

    // Get selected text or use empty string
    const text = editor.state.doc.textBetween($from.pos, $to.pos, " ");
    console.log("☑️ Selected text:", text);

    if (text.trim()) {
      // If there's selected text, convert it to a task list
      console.log("☑️ Converting selected text to task list");
      const result = editor.chain().focus().toggleTaskList().run();
      console.log("☑️ Toggle result:", result);
    } else {
      // If no text selected, try standard toggle first
      console.log("☑️ No text selected, trying standard toggle");
      const result = editor.chain().focus().toggleTaskList().run();
      console.log("☑️ Standard toggle result:", result);

      // Check if list was created
      setTimeout(() => {
        if (!editor.isActive("taskList")) {
          console.log("☑️ Standard toggle failed, trying direct insertion");
          // Try direct insertion first
          const insertResult = editor
            .chain()
            .focus()
            .insertContent({
              type: "taskList",
              content: [
                {
                  type: "taskItem",
                  attrs: {
                    checked: false,
                  },
                  content: [
                    {
                      type: "paragraph",
                      content: [],
                    },
                  ],
                },
              ],
            })
            .run();
          console.log("☑️ Direct insertion result:", insertResult);

          // If direct insertion also fails, try force create
          if (!insertResult) {
            console.log("☑️ Direct insertion failed, trying force create");
            forceCreateList("taskList");
          }
        }
      }, 50);
    }

    // Check state after command
    setTimeout(() => {
      console.log("☑️ After toggleTaskList:", {
        isTaskListActive: editor?.isActive("taskList"),
        isTaskItemActive: editor?.isActive("taskItem"),
        currentSelection: editor?.state.selection,
        content: editor?.getHTML(),
      });
    }, 100);
  };

  // Advanced formatting actions
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
  const toggleHighlight = () => editor?.chain().focus().toggleHighlight().run();
  const toggleSubscript = () => editor?.chain().focus().toggleSubscript().run();
  const toggleSuperscript = () =>
    editor?.chain().focus().toggleSuperscript().run();
  const toggleCode = () => editor?.chain().focus().toggleCode().run();
  const toggleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run();
  const toggleBlockquote = () =>
    editor?.chain().focus().toggleBlockquote().run();
  const addHorizontalRule = () =>
    editor?.chain().focus().setHorizontalRule().run();

  // Heading actions
  const setHeading = (level) => {
    if (editor?.isActive("heading", { level })) {
      editor?.chain().focus().setParagraph().run();
    } else {
      editor?.chain().focus().toggleHeading({ level }).run();
    }
  };

  // Color actions
  const setTextColor = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setColorPickerPosition({ x: rect.left, y: rect.bottom + 10 });
    setShowColorPicker(true);
    setShowHighlightPicker(false);
  };

  // Font family action
  const setFontFamily = (fontFamily) => {
    if (fontFamily === "default") {
      editor?.chain().focus().unsetFontFamily().run();
    } else {
      editor?.chain().focus().setFontFamily(fontFamily).run();
    }
  };

  // Font size action
  const setFontSize = (fontSize) => {
    if (!editor) return;

    console.log("📏 Setting font size:", fontSize);

    if (fontSize === "default") {
      // Remove any font size styling
      editor.chain().focus().unsetMark("textStyle").run();
    } else {
      // Apply font size using inline style
      editor.chain().focus().setMark("textStyle", { fontSize }).run();
    }
  };

  const setHighlightColor = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setColorPickerPosition({ x: rect.left, y: rect.bottom + 10 });
    setShowHighlightPicker(true);
    setShowColorPicker(false);
  };

  const handleColorChange = (color) => {
    editor?.chain().focus().setColor(color.hex).run();
    setShowColorPicker(false);
  };

  const handleHighlightChange = (color) => {
    editor?.chain().focus().setHighlight({ color: color.hex }).run();
    setShowHighlightPicker(false);
  };

  const clearTextColor = () => {
    editor?.chain().focus().unsetColor().run();
  };

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const addAttachment = () => {
    attachmentInputRef.current?.click();
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image file
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    await handleFileUpload(file, true); // true for images
  };

  const handleAttachmentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await handleFileUpload(file, false); // false for other attachments
  };

  const handleFileUpload = async (file, isImage) => {
    // Check file size (limit to 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert("File too large. Please choose a file under 100MB.");
      return;
    }

    // Check if file type is allowed
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",
      "image/svg+xml",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/markdown",
      "application/zip",
      "application/json",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(`File type ${file.type} is not supported.`);
      return;
    }

    if (!note?.id || !userId) {
      console.error("Upload failed - missing note ID or user ID:", {
        noteId: note?.id,
        userId,
      });
      alert("Please save the note first before adding attachments.");
      return;
    }

    console.log("Attempting to upload file:", {
      noteId: note.id,
      userId,
      fileName: file.name,
    });

    try {
      setIsLoading(true);

      // Get backend URL
      const backendUrl = await configService.getBackendUrl();

      // Create form data for file upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload the file to the backend
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${note.id}/attachments`,
        {
          method: "POST",
          body: formData, // Don't set Content-Type header, let browser set it for FormData
        }
      );

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Upload successful:", result);

      // Update local attachments state
      const newAttachment = result.attachment;
      setAttachments((prev) => [...prev, newAttachment]);

      // If it's an image, also insert it into the editor
      if (isImage) {
        const imageUrl = `${backendUrl}/api/${userId}/notes/${note.id}/attachments/${result.attachment.filename}`;
        editor
          ?.chain()
          .focus()
          .setImage({
            src: imageUrl,
            alt: file.name,
            title: file.name,
          })
          .run();
        // Add a new paragraph after the image so user can continue typing
        editor?.chain().focus().insertContent("\n\n").run();
      }
      // For non-image attachments, don't insert anything into the editor
      // They will be shown in the attachments panel below

      // Fetch updated note data from server to get current attachment metadata
      try {
        const noteResponse = await fetch(
          `${backendUrl}/api/${userId}/notes/${note.id}`
        );
        if (noteResponse.ok) {
          const updatedNote = await noteResponse.json();
          // Call onSave with the updated note to refresh the notes list
          onSave?.(updatedNote.content, updatedNote.markdown, updatedNote);
        } else {
          // Fallback: trigger a basic save
          onSave?.();
        }
      } catch (error) {
        console.error("Error fetching updated note:", error);
        // Fallback: trigger a basic save
        onSave?.();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      console.error("Error details:", {
        noteId: note?.id,
        userId,
        fileName: file.name,
      });
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setIsLoading(false);
      // Clear the inputs so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    }
  };

  const removeAttachment = async (filename) => {
    if (!note?.id || !userId) return;

    if (!confirm(`Remove attachment "${filename}"?`)) return;

    try {
      setIsLoading(true);

      // Get backend URL
      const backendUrl = await configService.getBackendUrl();

      // Remove the attachment from the backend
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${note.id}/attachments/${filename}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Delete failed: ${response.status} ${response.statusText}`
        );
      }

      console.log("Attachment removed successfully:", filename);

      // Update local attachments state
      setAttachments((prev) => prev.filter((att) => att.filename !== filename));

      // Fetch updated note data from server to get current attachment metadata
      try {
        const noteResponse = await fetch(
          `${backendUrl}/api/${userId}/notes/${note.id}`
        );
        if (noteResponse.ok) {
          const updatedNote = await noteResponse.json();
          // Call onSave with the updated note to refresh the notes list
          onSave?.(updatedNote.content, updatedNote.markdown, updatedNote);
        } else {
          // Fallback: trigger a basic save
          onSave?.();
        }
      } catch (error) {
        console.error("Error fetching updated note:", error);
        // Fallback: trigger a basic save
        onSave?.();
      }
    } catch (error) {
      console.error("Error removing attachment:", error);
      alert("Failed to remove attachment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType === "application/pdf") return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
      return "📋";
    if (mimeType === "text/plain") return "📄";
    if (mimeType === "text/markdown") return "📝";
    if (mimeType === "application/zip") return "🗜️";
    if (mimeType === "application/json") return "🔧";
    return "📎";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const saveNote = async () => {
    if (!editor) return;

    setIsLoading(true);
    try {
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      await onSave?.(html, markdown);
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add diagnostic function to global scope for testing
  useEffect(() => {
    window.testListRendering = () => {
      if (!editor) {
        console.error("❌ Editor not available");
        return;
      }

      console.log("🧪 Testing list rendering...");

      const testCases = [
        {
          name: "Bullet List",
          content:
            '<ul class="bullet-list list-disc"><li class="list-item">Item 1</li><li class="list-item">Item 2</li></ul>',
          expectedLines: 2,
        },
        {
          name: "Numbered List",
          content:
            '<ol class="ordered-list list-decimal"><li class="list-item">Item 1</li><li class="list-item">Item 2</li></ol>',
          expectedLines: 2,
        },
        {
          name: "Task List",
          content:
            '<ul data-type="taskList" class="task-list"><li data-type="taskItem" class="task-item" data-checked="false">Task 1</li><li data-type="taskItem" class="task-item" data-checked="false">Task 2</li></ul>',
          expectedLines: 2,
        },
      ];

      for (const test of testCases) {
        console.log(`\n📝 Testing ${test.name}:`);

        // Set test content
        editor.commands.setContent(test.content);

        // Check for issues
        const listItems = editor.view.dom.querySelectorAll("li");
        const actualLines = listItems.length;

        console.log(
          `Expected lines: ${test.expectedLines}, Actual lines: ${actualLines}`
        );

        if (actualLines !== test.expectedLines) {
          console.error(
            `❌ ${test.name} failed: Expected ${test.expectedLines} lines, got ${actualLines}`
          );
        } else {
          console.log(`✅ ${test.name} passed`);
        }

        // Check for double paragraphs
        const doubleParagraphs = Array.from(listItems).filter((li) => {
          const paragraphs = li.querySelectorAll("p");
          return paragraphs.length > 1;
        });

        if (doubleParagraphs.length > 0) {
          console.error(
            `❌ Found ${doubleParagraphs.length} list items with nested paragraphs!`
          );
          doubleParagraphs.forEach((li, index) => {
            console.error(`Double paragraph ${index + 1}:`, li.innerHTML);
          });
        } else {
          console.log(`✅ No nested paragraphs found`);
        }

        // Check for proper CSS classes
        const hasProperClasses = Array.from(listItems).every((li) => {
          return (
            li.classList.contains("list-item") ||
            li.classList.contains("task-item")
          );
        });

        console.log(
          `CSS classes: ${hasProperClasses ? "✅ Correct" : "❌ Missing"}`
        );
      }

      console.log("\n🧪 List rendering test complete!");
      console.log(
        "💡 To test manually: Create lists using the toolbar buttons and check the console for warnings."
      );
    };

    console.log(
      "🔧 Diagnostic function added: Run window.testListRendering() to test list rendering"
    );

    return () => {
      delete window.testListRendering;
    };
  }, [editor]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-2 flex-wrap">
          {/* Text Formatting */}
          <div className="flex space-x-1 border-r pr-2 mr-2">
            <button
              onClick={toggleBold}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("bold") ? "bg-blue-100 text-blue-700" : ""
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={toggleItalic}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("italic") ? "bg-blue-100 text-blue-700" : ""
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={toggleStrike}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("strike") ? "bg-blue-100 text-blue-700" : ""
              }`}
              title="Strikethrough"
            >
              <Strikethrough size={16} />
            </button>
            <button
              onClick={setHighlightColor}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("highlight") ? "bg-blue-100 text-blue-700" : ""
              }`}
              title="Highlight"
            >
              <Highlighter size={16} />
            </button>
            <button
              onClick={setTextColor}
              className="p-2 rounded hover:bg-gray-100"
              title="Text Color"
            >
              <Palette size={16} />
            </button>
          </div>

          {/* Font Family */}
          <div className="border-r pr-2 mr-2">
            <select
              onChange={(e) => setFontFamily(e.target.value)}
              value={editor?.getAttributes("textStyle").fontFamily || "default"}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Font Family"
            >
              <option value="default">Default</option>
              <option value="Inter, system-ui, sans-serif">Inter</option>
              <option value="Helvetica, Arial, sans-serif">Helvetica</option>
              <option value="Times, serif">Times</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Monaco, 'Lucida Console', monospace">
                Monaco
              </option>
              <option value="'Comic Sans MS', cursive">Comic Sans</option>
              <option value="Impact, sans-serif">Impact</option>
              <option value="Verdana, sans-serif">Verdana</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="border-r pr-2 mr-2">
            <select
              onChange={(e) => setFontSize(e.target.value)}
              value={editor?.getAttributes("textStyle").fontSize || "default"}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Font Size"
            >
              <option value="default">Default</option>
              <option value="12px">Small (12px)</option>
              <option value="14px">Medium (14px)</option>
              <option value="16px">Normal (16px)</option>
              <option value="18px">Large (18px)</option>
              <option value="20px">X-Large (20px)</option>
              <option value="24px">XX-Large (24px)</option>
              <option value="28px">Huge (28px)</option>
              <option value="32px">Giant (32px)</option>
            </select>
          </div>

          {/* Headings */}
          <div className="flex space-x-1 border-r pr-2 mr-2">
            <button
              onClick={() => setHeading(1)}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("heading", { level: 1 })
                  ? "bg-blue-100 text-blue-700"
                  : ""
              }`}
              title="Heading 1"
            >
              <Heading1 size={16} />
            </button>
            <button
              onClick={() => setHeading(2)}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("heading", { level: 2 })
                  ? "bg-blue-100 text-blue-700"
                  : ""
              }`}
              title="Heading 2"
            >
              <Heading2 size={16} />
            </button>
            <button
              onClick={() => setHeading(3)}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("heading", { level: 3 })
                  ? "bg-blue-100 text-blue-700"
                  : ""
              }`}
              title="Heading 3"
            >
              <Heading3 size={16} />
            </button>
          </div>

          {/* Lists */}
          <div className="flex space-x-1 border-r pr-2 mr-2">
            <button
              onClick={toggleBulletList}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("bulletList")
                  ? "bg-blue-100 text-blue-700"
                  : ""
              }`}
              title="Bullet List"
            >
              <List size={16} />
            </button>
            <button
              onClick={toggleOrderedList}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("orderedList")
                  ? "bg-blue-100 text-blue-700"
                  : ""
              }`}
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
            <button
              onClick={toggleTaskList}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("taskList") ? "bg-blue-100 text-blue-700" : ""
              }`}
              title="Task List"
            >
              <CheckSquare size={16} />
            </button>
          </div>

          {/* Code & Quote */}
          <div className="flex space-x-1 border-r pr-2 mr-2">
            <button
              onClick={toggleCode}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("code") ? "bg-blue-100 text-blue-700" : ""
              }`}
              title="Inline Code"
            >
              <Code size={16} />
            </button>
            <button
              onClick={toggleCodeBlock}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("codeBlock") ? "bg-blue-100 text-blue-700" : ""
              }`}
              title="Code Block"
            >
              <FileText size={16} />
            </button>
            <button
              onClick={toggleBlockquote}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("blockquote")
                  ? "bg-blue-100 text-blue-700"
                  : ""
              }`}
              title="Quote"
            >
              <Quote size={16} />
            </button>
          </div>

          {/* Scripts & Special */}
          <div className="flex space-x-1 border-r pr-2 mr-2">
            <button
              onClick={toggleSubscript}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("subscript") ? "bg-blue-100 text-blue-700" : ""
              }`}
              title="Subscript"
            >
              <SubIcon size={16} />
            </button>
            <button
              onClick={toggleSuperscript}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive("superscript")
                  ? "bg-blue-100 text-blue-700"
                  : ""
              }`}
              title="Superscript"
            >
              <SupIcon size={16} />
            </button>
            <button
              onClick={addHorizontalRule}
              className="p-2 rounded hover:bg-gray-100"
              title="Horizontal Rule"
            >
              <Minus size={16} />
            </button>
          </div>

          {/* Links and Media */}
          <div className="flex space-x-1 border-r pr-2 mr-2">
            <button
              onClick={addLink}
              className="p-2 rounded hover:bg-gray-100"
              title="Add Link"
            >
              <LinkIcon size={16} />
            </button>
            <button
              onClick={addImage}
              className="p-2 rounded hover:bg-gray-100"
              title="Upload Image"
            >
              <ImageIcon size={16} />
            </button>
            <button
              onClick={addAttachment}
              className="p-2 rounded hover:bg-gray-100"
              title="Upload Attachment"
            >
              <Paperclip size={16} />
            </button>
          </div>

          {/* Save */}
          <button
            onClick={saveNote}
            disabled={isLoading}
            className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            title="Save Note (Ctrl+S)"
          >
            <Save size={16} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        <EditorContent editor={editor} />

        {/* Attachments Panel - placed after editor but ensure space below */}
        {attachments.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center">
              <Paperclip size={16} className="mr-2" />
              Attachments ({attachments.length})
            </h4>
            <div className="space-y-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-3 rounded border"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {getFileIcon(attachment.type)}
                    </span>
                    <div>
                      <div className="font-medium text-sm text-gray-800">
                        {attachment.originalName || attachment.filename}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(attachment.size)} •{" "}
                        {new Date(attachment.uploaded).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewingAttachment(attachment)}
                      className="p-1 rounded hover:bg-gray-100"
                      title="View/Download"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => removeAttachment(attachment.filename)}
                      className="p-1 rounded hover:bg-red-100 text-red-600"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
        <input
          ref={attachmentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.json"
          onChange={handleAttachmentUpload}
          style={{ display: "none" }}
        />
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <span>
            {editor?.storage.characterCount?.characters() || 0} characters,{" "}
            {editor?.storage.characterCount?.words() || 0} words
          </span>
          <span className="text-xs">
            Auto-save: {(autoSaveConfig.autoSaveDelayMs / 1000).toFixed(1)}s (≥
            {autoSaveConfig.minChangePercentage}% change) • Press Ctrl+S to save
            manually • Smart change detection
          </span>
        </div>
      </div>

      {/* Color Picker Overlays */}
      {showColorPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowColorPicker(false)}
          />
          <div
            className="fixed z-50"
            style={{
              left: `${colorPickerPosition.x}px`,
              top: `${colorPickerPosition.y}px`,
              transform: "translateX(-50%)",
            }}
          >
            <ComprehensiveColorPicker
              title="Text Color"
              color="#000000"
              onChange={handleColorChange}
              onChangeComplete={(color) => {
                handleColorChange(color);
                setShowColorPicker(false);
              }}
            />
          </div>
        </>
      )}

      {showHighlightPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowHighlightPicker(false)}
          />
          <div
            className="fixed z-50"
            style={{
              left: `${colorPickerPosition.x}px`,
              top: `${colorPickerPosition.y}px`,
              transform: "translateX(-50%)",
            }}
          >
            <ComprehensiveColorPicker
              title="Highlight Color"
              color="#ffff00"
              onChange={handleHighlightChange}
              onChangeComplete={(color) => {
                handleHighlightChange(color);
                setShowHighlightPicker(false);
              }}
            />
          </div>
        </>
      )}

      {/* File Viewer */}
      {viewingAttachment && (
        <FileViewer
          attachment={viewingAttachment}
          userId={userId}
          noteId={note.id}
          onClose={() => setViewingAttachment(null)}
        />
      )}
    </div>
  );
};

// Storage Service for file system operations
class NoteStorageService {
  constructor() {
    this.notesPath = localStorage.getItem("notesPath") || "./notes";
    // Use environment-based URL resolution for reliability
    this.baseUrl = this.getBaseUrl();
  }

  getBaseUrl() {
    // Simple environment detection
    const isProduction =
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    if (isProduction) {
      // In production, assume backend is on same host, port 3001
      return `${window.location.protocol}//${window.location.hostname}:3001/api`;
    } else {
      // In development, use configured backend port (3004 per config.json)
      return "http://localhost:3004/api";
    }
  }

  async ensureConfig() {
    // For now, use the simple URL approach since async config was causing issues
    if (!this.baseUrl) {
      this.baseUrl = this.getBaseUrl();
    }
  }

  setNotesPath(path) {
    this.notesPath = path;
    localStorage.setItem("notesPath", path);
  }

  async createNote(userId, title = "Untitled Note") {
    await this.ensureConfig();
    const noteId = uuidv4();
    const note = {
      id: noteId,
      title,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: [],
      notebook: null,
      folder: null,
      starred: false,
      deleted: false,
      version: 1,
      attachments: [],
    };

    try {
      const response = await fetch(`${this.baseUrl}/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: "# " + title }),
      });

      if (!response.ok) throw new Error("Failed to create note");
      return await response.json();
    } catch (error) {
      console.error("Error creating note:", error);
      throw error;
    }
  }

  async updateNote(userId, noteId, content, metadata = {}) {
    await this.ensureConfig();
    try {
      const response = await fetch(
        `${this.baseUrl}/${userId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, metadata }),
        }
      );

      if (!response.ok) throw new Error("Failed to update note");
      return await response.json();
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  }

  async deleteNote(userId, noteId) {
    await this.ensureConfig();
    try {
      const response = await fetch(
        `${this.baseUrl}/${userId}/notes/${noteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete note");
      return await response.json();
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  }

  async getNotes(userId) {
    await this.ensureConfig();
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/notes`);
      if (!response.ok) throw new Error("Failed to fetch notes");
      return await response.json();
    } catch (error) {
      console.error("Error fetching notes:", error);
      throw error;
    }
  }

  async uploadAttachment(userId, noteId, file) {
    await this.ensureConfig();
    const formData = new FormData();
    formData.append("file", file);

    console.log("Uploading attachment:", {
      userId,
      noteId,
      fileName: file.name,
      fileSize: file.size,
    });
    const url = `${this.baseUrl}/${userId}/notes/${noteId}/attachments`;
    console.log("Upload URL:", url);

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed with response:", errorText);
        throw new Error(
          `Failed to upload attachment: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Upload successful, result:", result);
      return result;
    } catch (error) {
      console.error("Error uploading attachment:", error);
      throw error;
    }
  }

  async removeAttachment(userId, noteId, filename) {
    await this.ensureConfig();
    try {
      const response = await fetch(
        `${this.baseUrl}/${userId}/notes/${noteId}/attachments/${filename}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to remove attachment");
      return await response.json();
    } catch (error) {
      console.error("Error removing attachment:", error);
      throw error;
    }
  }

  async validateStoragePath(path) {
    await this.ensureConfig();
    // Mock validation for frontend-only testing
    // In production, this would make an API call to validate the actual file system path
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay

      // Mock validation logic
      if (!path || path.trim() === "") {
        return {
          valid: false,
          errors: ["Path cannot be empty"],
          path,
        };
      }

      // Basic path validation
      if (
        path.includes("..") ||
        path.startsWith("/tmp") ||
        path.startsWith("/system")
      ) {
        return {
          valid: false,
          errors: ["Invalid or unsafe path"],
          path,
        };
      }

      // Mock successful validation
      return {
        valid: true,
        path,
        spaceAvailable: "15.2 GB",
        noteCount: Math.floor(Math.random() * 50), // Mock existing notes
        writable: true,
      };
    } catch (error) {
      console.error("Error validating storage path:", error);
      return {
        valid: false,
        errors: ["Validation failed: " + error.message],
        path,
      };
    }
  }
}

// Admin Settings Component
const AdminSettings = ({ isOpen, onClose, currentPath, onPathChange }) => {
  const [newPath, setNewPath] = useState(currentPath);
  const [validation, setValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const validatePath = async () => {
    if (!newPath) return;

    setIsValidating(true);
    try {
      // Use configService to validate the path
      const backendUrl = await configService.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/validate-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: newPath }),
      });

      if (response.ok) {
        const result = await response.json();
        setValidation(result);
      } else {
        setValidation({
          valid: false,
          errors: ["Failed to validate path"],
          path: newPath,
        });
      }
    } catch (error) {
      setValidation({
        valid: false,
        errors: ["Failed to validate path"],
        path: newPath,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (validation?.valid) {
      await onPathChange(newPath);
      setValidation(null); // Clear validation state
      onClose();
    }
  };

  const handleCancel = () => {
    setNewPath(currentPath); // Reset to original path
    setValidation(null); // Clear validation state
    onClose();
  };

  const getQuickPaths = () => {
    const homeDir =
      "/Users/" +
      (window.navigator.userAgent.includes("Mac") ? "username" : "user");
    return [
      { label: "Default (./notes)", path: "./notes" },
      { label: "Documents/Notes", path: homeDir + "/Documents/Notes" },
      { label: "Desktop/Notes", path: homeDir + "/Desktop/Notes" },
      {
        label: "iCloud Drive/Notes",
        path: homeDir + "/Library/Mobile Documents/com~apple~CloudDocs/Notes",
      },
    ];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[700px] max-h-[85vh] overflow-y-auto shadow-2xl">
        <h3 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
          <Settings className="mr-2" size={24} />
          Admin Settings - Storage Configuration
        </h3>

        <div className="space-y-6">
          {/* Current Path Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">
              Current Storage Location
            </h4>
            <p className="text-sm text-blue-700 font-mono">{currentPath}</p>
          </div>

          {/* Quick Path Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Path Options
            </label>
            <div className="grid grid-cols-2 gap-2">
              {getQuickPaths().map((option, index) => (
                <button
                  key={index}
                  onClick={() => setNewPath(option.path)}
                  className={`p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors ${
                    newPath === option.path
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">
                    {option.path}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Path Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Storage Location
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newPath}
                onChange={(e) => {
                  setNewPath(e.target.value);
                  setValidation(null); // Clear validation when path changes
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="/path/to/notes"
              />
              <button
                onClick={() => {
                  // In a real app, this would open a native folder picker
                  alert(
                    "Folder picker would open here. For now, type the path manually."
                  );
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center space-x-2 transition-colors"
              >
                <FolderOpen size={16} />
                <span>Browse</span>
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>• Choose where your notes and attachments will be stored</p>
              <p>
                • Each note will be stored in its own folder within this
                location
              </p>
              <p>• The path should be writable and have sufficient space</p>
            </div>
          </div>

          {/* Validation Button */}
          <button
            onClick={validatePath}
            disabled={isValidating || !newPath || newPath === currentPath}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Validating...</span>
              </>
            ) : (
              <>
                <span>Validate Storage Path</span>
              </>
            )}
          </button>

          {/* Validation Results */}
          {validation && (
            <div
              className={`p-4 rounded-lg border ${
                validation.valid
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h4
                className={`font-medium mb-2 ${
                  validation.valid ? "text-green-800" : "text-red-800"
                }`}
              >
                {validation.valid ? "✅ Path Valid" : "❌ Path Invalid"}
              </h4>

              {validation.errors && validation.errors.length > 0 && (
                <ul className="text-sm text-red-700 space-y-1">
                  {validation.errors.map((error, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              )}

              {validation.valid && (
                <div className="text-sm text-green-700 space-y-1">
                  <p className="flex items-center">
                    <span className="mr-2">✓</span>
                    Path exists and is writable
                  </p>
                  <p className="flex items-center">
                    <span className="mr-2">✓</span>
                    {validation.spaceAvailable || "Sufficient"} space available
                  </p>
                  {validation.noteCount !== undefined && (
                    <p className="flex items-center">
                      <span className="mr-2">✓</span>
                      {validation.noteCount === 0
                        ? "Ready for new notes"
                        : `Found ${validation.noteCount} existing notes`}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Migration Warning */}
          {validation?.valid &&
            validation.noteCount > 0 &&
            newPath !== currentPath && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">
                  ⚠️ Migration Required
                </h4>
                <p className="text-sm text-yellow-700">
                  Changing the storage location will require migrating existing
                  notes. This process will copy all notes and attachments to the
                  new location.
                </p>
              </div>
            )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!validation?.valid || newPath === currentPath}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipTapEditor;
export { NoteStorageService, AdminSettings };
