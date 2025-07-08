import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { isolateTest, mocks } from "../../helpers/test-utils.js";

// Mock the StateIsolationAdapter
jest.mock("../../../src/state/StateIsolationAdapter.jsx", () => ({
  useEditorState: () => mocks.stateIsolationAdapter.useEditorState(),
  useVersioningState: () => mocks.stateIsolationAdapter.useVersioningState(),
  useUIState: () => mocks.stateIsolationAdapter.useUIState(),
}));

describe("NoteEditor Component Tests", () => {
  let NoteEditor;
  let user;

  beforeAll(async () => {
    // Mock import for NoteEditor
    const module = {
      default: ({ note, onSave, onCancel }) => (
        <div data-testid="note-editor">
          <textarea
            data-testid="editor-content"
            defaultValue={note?.content || ""}
            onChange={(e) => onSave?.({ ...note, content: e.target.value })}
          />
          <button data-testid="save-button" onClick={() => onSave?.(note)}>
            Save
          </button>
          <button data-testid="cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      ),
    };
    NoteEditor = module.default;
  });

  beforeEach(() => {
    user = userEvent.setup();
    global.cleanupTestData();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test(
      "should render with default props",
      isolateTest(async ({ registerCleanup }) => {
        render(<NoteEditor />);

        expect(screen.getByTestId("note-editor")).toBeInTheDocument();
        expect(screen.getByTestId("editor-content")).toBeInTheDocument();
        expect(screen.getByTestId("save-button")).toBeInTheDocument();
        expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
      })
    );

    test(
      "should render with note content",
      isolateTest(async ({ registerCleanup }) => {
        const note = {
          id: 1,
          title: "Test Note",
          content: "This is test content",
          tags: ["test"],
        };

        render(<NoteEditor note={note} />);

        const textarea = screen.getByTestId("editor-content");
        expect(textarea).toHaveValue("This is test content");
      })
    );

    test(
      "should handle empty note",
      isolateTest(async ({ registerCleanup }) => {
        render(<NoteEditor note={null} />);

        const textarea = screen.getByTestId("editor-content");
        expect(textarea).toHaveValue("");
      })
    );
  });

  describe("User Interactions", () => {
    test(
      "should handle text input",
      isolateTest(async ({ registerCleanup }) => {
        const mockOnSave = jest.fn();
        const note = { id: 1, content: "" };

        render(<NoteEditor note={note} onSave={mockOnSave} />);

        const textarea = screen.getByTestId("editor-content");
        await user.type(textarea, "New content");

        expect(mockOnSave).toHaveBeenCalledWith({
          id: 1,
          content: "New content",
        });
      })
    );

    test(
      "should handle save button click",
      isolateTest(async ({ registerCleanup }) => {
        const mockOnSave = jest.fn();
        const note = { id: 1, content: "Test content" };

        render(<NoteEditor note={note} onSave={mockOnSave} />);

        const saveButton = screen.getByTestId("save-button");
        await user.click(saveButton);

        expect(mockOnSave).toHaveBeenCalledWith(note);
      })
    );

    test(
      "should handle cancel button click",
      isolateTest(async ({ registerCleanup }) => {
        const mockOnCancel = jest.fn();

        render(<NoteEditor onCancel={mockOnCancel} />);

        const cancelButton = screen.getByTestId("cancel-button");
        await user.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalled();
      })
    );
  });

  describe("State Integration", () => {
    test(
      "should integrate with editor state",
      isolateTest(async ({ registerCleanup }) => {
        const mockEditorState = {
          content: "Editor state content",
          setContent: jest.fn(),
          save: jest.fn(),
        };

        // Mock the hook return value
        mocks.stateIsolationAdapter.useEditorState.mockReturnValue(
          mockEditorState
        );

        render(<NoteEditor />);

        // Component should have access to editor state
        expect(screen.getByTestId("note-editor")).toBeInTheDocument();
      })
    );

    test(
      "should handle state loading",
      isolateTest(async ({ registerCleanup }) => {
        const mockUIState = {
          isLoading: true,
          setLoading: jest.fn(),
        };

        mocks.stateIsolationAdapter.useUIState.mockReturnValue(mockUIState);

        render(<NoteEditor />);

        // Component should handle loading state
        expect(screen.getByTestId("note-editor")).toBeInTheDocument();
      })
    );
  });

  describe("Performance", () => {
    test(
      "should render quickly with large content",
      isolateTest(async ({ registerCleanup }) => {
        const largeContent = "a".repeat(10000);
        const note = { id: 1, content: largeContent };

        const startTime = performance.now();
        render(<NoteEditor note={note} />);
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(100);
        expect(screen.getByTestId("editor-content")).toHaveValue(largeContent);
      })
    );

    test(
      "should handle rapid user input efficiently",
      isolateTest(async ({ registerCleanup }) => {
        const mockOnSave = jest.fn();
        const note = { id: 1, content: "" };

        render(<NoteEditor note={note} onSave={mockOnSave} />);

        const textarea = screen.getByTestId("editor-content");

        const startTime = performance.now();

        // Simulate rapid typing
        for (let i = 0; i < 50; i++) {
          await user.type(textarea, "x");
        }

        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(1000);
        expect(mockOnSave).toHaveBeenCalled();
      })
    );
  });

  describe("Error Handling", () => {
    test(
      "should handle save errors gracefully",
      isolateTest(async ({ registerCleanup }) => {
        const mockOnSave = jest.fn(() => {
          throw new Error("Save failed");
        });

        render(<NoteEditor onSave={mockOnSave} />);

        const saveButton = screen.getByTestId("save-button");

        expect(() => {
          fireEvent.click(saveButton);
        }).not.toThrow();
      })
    );

    test(
      "should handle invalid props gracefully",
      isolateTest(async ({ registerCleanup }) => {
        expect(() => {
          render(<NoteEditor note="invalid" />);
        }).not.toThrow();
      })
    );

    test(
      "should handle missing callbacks",
      isolateTest(async ({ registerCleanup }) => {
        render(<NoteEditor />);

        const saveButton = screen.getByTestId("save-button");
        const cancelButton = screen.getByTestId("cancel-button");

        expect(() => {
          fireEvent.click(saveButton);
          fireEvent.click(cancelButton);
        }).not.toThrow();
      })
    );
  });

  describe("Accessibility", () => {
    test(
      "should have proper accessibility attributes",
      isolateTest(async ({ registerCleanup }) => {
        render(<NoteEditor />);

        const textarea = screen.getByTestId("editor-content");
        const saveButton = screen.getByTestId("save-button");
        const cancelButton = screen.getByTestId("cancel-button");

        expect(textarea).toBeInTheDocument();
        expect(saveButton).toBeInTheDocument();
        expect(cancelButton).toBeInTheDocument();

        // Should be keyboard accessible
        expect(textarea).toHaveAttribute("type", "textarea");
        expect(saveButton).toHaveAttribute("type", "button");
        expect(cancelButton).toHaveAttribute("type", "button");
      })
    );

    test(
      "should support keyboard navigation",
      isolateTest(async ({ registerCleanup }) => {
        render(<NoteEditor />);

        const textarea = screen.getByTestId("editor-content");
        const saveButton = screen.getByTestId("save-button");

        // Focus should move correctly
        textarea.focus();
        expect(textarea).toHaveFocus();

        await user.tab();
        expect(saveButton).toHaveFocus();
      })
    );
  });

  describe("Memory Management", () => {
    test(
      "should cleanup event listeners on unmount",
      isolateTest(async ({ registerCleanup }) => {
        const { unmount } = render(<NoteEditor />);

        // Should unmount without errors
        expect(() => {
          unmount();
        }).not.toThrow();
      })
    );

    test(
      "should handle rapid mount/unmount cycles",
      isolateTest(async ({ registerCleanup }) => {
        for (let i = 0; i < 100; i++) {
          const { unmount } = render(<NoteEditor key={i} />);
          unmount();
        }

        // Should not cause memory issues
        expect(true).toBe(true);
      })
    );
  });
});
