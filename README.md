# Noet - Modern Note-Taking App 📝

A modern, feature-rich note-taking application built with React and Slate.js, designed to replace broken contenteditable implementations with a robust, extensible rich text editor.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/SamGallant/noet.git
cd noet

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🎯 Demo Accounts

### Demo User

- **Email**: demo@example.com
- **Password**: demo123

### Admin User

- **Email**: admin@example.com
- **Password**: admin123

## ✨ Features

### Rich Text Editor (Slate.js)

- **Text Formatting**: Bold, italic, underline, inline code
- **Auto-save**: Notes save automatically every 2 seconds
- **Keyboard Shortcuts**: Standard shortcuts (Ctrl+B, Ctrl+I, etc.)
- **Modern Architecture**: Built on Slate.js for extensibility

### Core Functionality

- **Secure Authentication**: User accounts with session management
- **Notes Management**: Create, edit, organize notes
- **Clean UI**: Modern interface with Tailwind CSS
- **Responsive Design**: Works on desktop and mobile

## 🚧 In Development

### Enhanced Editor Features

- [ ] Headings (H1, H2, H3)
- [ ] Lists (bulleted, numbered)
- [ ] Block quotes and code blocks
- [ ] Text alignment options
- [ ] Link insertion/editing
- [ ] Image support
- [ ] Advanced keyboard shortcuts

### Organization Features

- [ ] Notebook management
- [ ] Tag-based organization
- [ ] Search and filtering
- [ ] Trash/restore functionality
- [ ] Enhanced sidebar navigation

## 🛠 Tech Stack

- **Frontend**: React 18, Vite
- **Editor**: Slate.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React useState/useEffect
- **Build Tool**: Vite

## 📁 Project Structure

```
src/
├── App.jsx              # Main application component
├── index.css            # Global styles
└── main.jsx             # Entry point

docs/
├── SLATE_MIGRATION_README.md  # Migration documentation
└── DEVELOPMENT.md              # Development plan

config/
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── postcss.config.js    # PostCSS configuration
```

## 🔄 Development Workflow

### Branch Strategy

- `main` - Stable, working versions
- `feature/*` - Individual feature development
- `bugfix/*` - Bug fixes
- `enhance/*` - UI/UX enhancements

### Commit Conventions

- `feat(scope): description` - New features
- `fix(scope): description` - Bug fixes
- `docs(scope): description` - Documentation
- `enhance(scope): description` - UI/UX improvements

### Development Commands

```bash
# Quick status and commit helper
./dev-status.sh

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Migration Background

This project represents a complete migration from a broken contenteditable-based editor to a modern Slate.js implementation. The original app suffered from:

- Custom DOM manipulation causing crashes
- Broken list, formatting, and deletion features
- Unmaintainable contenteditable code
- Poor state management

### Migration Achievements

✅ **Eliminated custom DOM manipulation**  
✅ **Implemented modern Slate.js editor**  
✅ **Restored all core functionality**  
✅ **Added auto-save and keyboard shortcuts**  
✅ **Clean, maintainable codebase**  
✅ **Modern React patterns and state management**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat(editor): add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Development Roadmap

### Phase 1: Core Editor (In Progress)

- [x] Basic text formatting
- [x] Auto-save functionality
- [ ] Headings and lists
- [ ] Block elements
- [ ] Links and images

### Phase 2: Organization

- [ ] Enhanced sidebar navigation
- [ ] Search and filtering
- [ ] Notebook management
- [ ] Tag system

### Phase 3: Advanced Features

- [ ] Collaboration features
- [ ] Export/import functionality
- [ ] Themes and customization
- [ ] Offline support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Slate.js](https://slatejs.org/) - The amazing rich text editor framework
- [React](https://reactjs.org/) - The UI library
- [Tailwind CSS](https://tailwindcss.com/) - For beautiful, utility-first styling
- [Lucide](https://lucide.dev/) - For the icon set

---

**Status**: Active Development 🚧  
**Version**: 1.0.0-beta  
**Last Updated**: June 30, 2025
