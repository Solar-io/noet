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

  // Auto-save functionality
  const triggerAutoSave = async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (note && editor && userId) {
        try {
          const content = editor.getHTML();
          const markdown = turndownService.turndown(content);

          // Get backend URL
          const backendUrl = await configService.getBackendUrl();

          // Save to backend using the correct API format
          const response = await fetch(
            `${backendUrl}/api/${userId}/notes/${note.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: note.title,
                content,
                markdown,
                tags: note.tags,
                notebook: note.notebook,
                folder: note.folder,
              }),
            }
          );

          if (response.ok) {
            console.log("� Auto-saved note:", note.title);
            // Also call the parent's onSave if provided
            onSave?.({
              ...note,
              content,
              markdown,
            });
          } else {
            console.error("❌ Auto-save failed:", response.statusText);
          }
        } catch (error) {
          console.error("❌ Auto-save error:", error);
        }
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
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
      BulletList.configure({
        HTMLAttributes: {
          class: "bullet-list",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "ordered-list",
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: "list-item",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "task-list",
        },
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
      TextStyle,
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
      handleKeyDown: (view, event) => {
        const { state, dispatch } = view;
        const { selection } = state;
        const { $from, $to } = selection;

        // Handle Enter key for list exit behavior
        if (event.key === "Enter") {
          // Check if we're in a list item
          const listItem = $from.node($from.depth - 1);
          const listItemPos = $from.before($from.depth - 1);

          if (listItem && listItem.type.name === "listItem") {
            // Check if the list item is empty
            const listItemContent = listItem.textContent.trim();

            if (listItemContent === "") {
              // This is an empty list item - exit the list
              event.preventDefault();

              // Get the list container
              const listContainer = $from.node($from.depth - 2);
              const listContainerPos = $from.before($from.depth - 2);

              // If there's only one empty item in the list, remove the whole list
              if (listContainer && listContainer.childCount === 1) {
                const tr = state.tr.delete(
                  listContainerPos,
                  listContainerPos + listContainer.nodeSize
                );
                tr.insert(
                  listContainerPos,
                  state.schema.nodes.paragraph.create()
                );
                tr.setSelection(
                  state.selection.constructor.near(
                    tr.doc.resolve(listContainerPos + 1)
                  )
                );
                dispatch(tr);
                return true;
              } else {
                // Remove the empty list item and create a paragraph after the list
                const tr = state.tr.delete(
                  listItemPos,
                  listItemPos + listItem.nodeSize
                );
                const afterListPos =
                  listContainerPos + listContainer.nodeSize - listItem.nodeSize;
                tr.insert(afterListPos, state.schema.nodes.paragraph.create());
                tr.setSelection(
                  state.selection.constructor.near(
                    tr.doc.resolve(afterListPos + 1)
                  )
                );
                dispatch(tr);
                return true;
              }
            }
          }
        }

        // Handle Backspace key for list item lifting
        if (event.key === "Backspace") {
          // Check if we're at the start of a list item
          const listItem = $from.node($from.depth - 1);

          if (
            listItem &&
            listItem.type.name === "listItem" &&
            $from.parentOffset === 0
          ) {
            const listItemContent = listItem.textContent.trim();

            // If the list item is empty, remove it
            if (listItemContent === "") {
              event.preventDefault();

              const listItemPos = $from.before($from.depth - 1);
              const listContainer = $from.node($from.depth - 2);
              const listContainerPos = $from.before($from.depth - 2);

              if (listContainer && listContainer.childCount === 1) {
                // Last item in list - remove the whole list
                const tr = state.tr.delete(
                  listContainerPos,
                  listContainerPos + listContainer.nodeSize
                );
                tr.insert(
                  listContainerPos,
                  state.schema.nodes.paragraph.create()
                );
                tr.setSelection(
                  state.selection.constructor.near(
                    tr.doc.resolve(listContainerPos + 1)
                  )
                );
                dispatch(tr);
              } else {
                // Remove just this list item
                const tr = state.tr.delete(
                  listItemPos,
                  listItemPos + listItem.nodeSize
                );
                dispatch(tr);
              }
              return true;
            } else {
              // List item has content - lift it out of the list
              event.preventDefault();

              const listItemPos = $from.before($from.depth - 1);
              const listContainer = $from.node($from.depth - 2);
              const listContainerPos = $from.before($from.depth - 2);

              // Create a paragraph with the list item content
              const paragraph = state.schema.nodes.paragraph.create(
                {},
                listItem.content
              );

              if (listContainer && listContainer.childCount === 1) {
                // Last item in list - replace the whole list with paragraph
                const tr = state.tr.replaceWith(
                  listContainerPos,
                  listContainerPos + listContainer.nodeSize,
                  paragraph
                );
                tr.setSelection(
                  state.selection.constructor.near(
                    tr.doc.resolve(listContainerPos + 1)
                  )
                );
                dispatch(tr);
              } else {
                // Replace just this list item with paragraph
                const tr = state.tr.replaceWith(
                  listItemPos,
                  listItemPos + listItem.nodeSize,
                  paragraph
                );
                tr.setSelection(
                  state.selection.constructor.near(
                    tr.doc.resolve(listItemPos + 1)
                  )
                );
                dispatch(tr);
              }
              return true;
            }
          }
        }

        // Handle Tab key for list nesting
        if (event.key === "Tab") {
          const listItem = $from.node($from.depth - 1);

          if (listItem && listItem.type.name === "listItem") {
            event.preventDefault();

            if (event.shiftKey) {
              // Shift+Tab: outdent (lift) the list item
              const listItemPos = $from.before($from.depth - 1);
              const listContainer = $from.node($from.depth - 2);
              const listContainerPos = $from.before($from.depth - 2);

              // Create a paragraph with the list item content
              const paragraph = state.schema.nodes.paragraph.create(
                {},
                listItem.content
              );

              if (listContainer && listContainer.childCount === 1) {
                // Last item in list - replace the whole list with paragraph
                const tr = state.tr.replaceWith(
                  listContainerPos,
                  listContainerPos + listContainer.nodeSize,
                  paragraph
                );
                tr.setSelection(
                  state.selection.constructor.near(
                    tr.doc.resolve(listContainerPos + 1)
                  )
                );
                dispatch(tr);
              } else {
                // Insert paragraph after the list
                const afterListPos = listContainerPos + listContainer.nodeSize;
                const tr = state.tr.delete(
                  listItemPos,
                  listItemPos + listItem.nodeSize
                );
                tr.insert(afterListPos - listItem.nodeSize, paragraph);
                tr.setSelection(
                  state.selection.constructor.near(
                    tr.doc.resolve(afterListPos - listItem.nodeSize + 1)
                  )
                );
                dispatch(tr);
              }
              return true;
            } else {
              // Tab: indent (nest) the list item
              // For now, just maintain current behavior (could be enhanced later)
              return false;
            }
          }
        }

        return false;
      },
    },
  });

  // Update attachments when note changes
  useEffect(() => {
    setAttachments(note?.attachments || []);
  }, [note]);

  // Update editor content when note changes (only when switching notes, not during editing)
  useEffect(() => {
    if (editor && note && note.id) {
      const newContent = note.content || "<p>Start writing your note...</p>";
      const currentContent = editor.getHTML();

      // Only update if this is a different note (by ID) or if the content is significantly different
      // Don't update during typing to prevent cursor jumps
      const currentNoteId = getEditorNoteId(editor);
      const isNewNote = currentNoteId !== note.id;
      const hasSignificantChange =
        currentContent !== newContent &&
        (currentContent === "<p>Start writing your note...</p>" ||
          currentContent === "<p></p>" ||
          !currentContent.trim());

      if (isNewNote || hasSignificantChange) {
        editor.commands.setContent(newContent);
        setEditorNoteId(editor, note.id);
        console.log("📝 Updated editor content for note:", note.title);
      }
    }
  }, [editor, note?.id]); // Only depend on note ID, not content

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Toolbar actions
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleBulletList = () =>
    editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () =>
    editor?.chain().focus().toggleOrderedList().run();
  const toggleTaskList = () => editor?.chain().focus().toggleTaskList().run();

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

      // Trigger a save to update the note metadata
      onSave?.();
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

      // Trigger a save to update the note metadata
      onSave?.();
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
            Auto-save enabled • Press Ctrl+S to save manually
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

      {/* File Viewer Modal */}
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
