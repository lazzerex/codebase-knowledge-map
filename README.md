# 🗺️ Codebase Knowledge Map

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-7.8+-FF6B35?style=flat&logo=d3.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18+-000000?style=flat&logo=express&logoColor=white)
![Babel](https://img.shields.io/badge/Babel-7.23+-F9DC3E?style=flat&logo=babel&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![License MIT](https://img.shields.io/badge/License-MIT-green?style=flat)

A beautiful, interactive visualization tool that analyzes JavaScript/TypeScript codebases and generates visual dependency graphs. Perfect for understanding code structure, identifying complexity hotspots, and onboarding new developers.


## ✨ Features

- **📊 Interactive Graph Visualization** - D3.js-powered force-directed graph showing function relationships
- **🔍 Function Analysis** - Extracts functions, methods, classes, and their dependencies
- **🎯 Complexity Analysis** - Calculates cyclomatic complexity and highlights "hotspots"
- **🎨 Beautiful UI** - Modern dark theme with intuitive controls
- **⚡ Real-time Interactions** - Hover, click, and drag nodes for exploration
- **🖱️ Advanced Controls** - Zoom, pan, fullscreen, and keyboard shortcuts
- **📱 Responsive Design** - Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lazzerex/codebase-knowledge-map.git
   cd codebase-knowledge-map
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

5. **Click "Load Data"** to see the sample visualization!

## 🎮 Controls

### 🖱️ Mouse Controls
- **Drag nodes** to reposition them
- **Scroll** to zoom in/out
- **Click nodes** to highlight connections
- **Hover** for function details

### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + F` - Toggle fullscreen
- `Ctrl/Cmd + 0` - Reset zoom
- `Ctrl/Cmd + 1` - Fit view to screen
- `T` - Toggle sidebar
- `ESC` - Exit fullscreen

### 🎛️ UI Controls
- **🔍 Fullscreen** - Immersive full-screen mode
- **📐 Fit View** - Auto-zoom to fit all nodes
- **📋 Toggle Sidebar** - Show/hide function list
- **❓ Help** - Display help dialog

## 🎨 Visual Guide

### Node Colors
- 🟢 **Green** - Low complexity (1-2)
- 🟠 **Orange** - Medium complexity (3-4)  
- 🔴 **Red** - High complexity (5+)

### Node Sizes
- **Larger nodes** = Higher complexity functions
- **Smaller nodes** = Simpler functions

### Connections
- **Arrows** show function call dependencies
- **Hover** to highlight connection paths

## 📁 Project Structure

```
codebase-knowledge-map/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML structure
│   ├── style.css          # Styling and themes
│   └── script.js          # D3.js visualization logic
├── src/
│   └── parser/            # Code analysis engine
│       └── javascript-parser.js
├── test-code/             # Sample code for analysis
│   ├── sample.js
│   └── shopping-cart.js
├── server.js              # Express server
├── test-parser.js         # CLI testing tool
└── package.json
```

## 🛠️ Development

### Adding Your Own Code

1. **Add files to `test-code/` directory**
   ```bash
   cp your-file.js test-code/
   ```

2. **Restart the server**
   ```bash
   npm start
   ```

3. **Click "Load Data"** to analyze your code

### Running Tests

```bash
# Test the parser directly
npm run test

# Or use the CLI tool
node test-parser.js
```

### Development Mode

```bash
# Auto-restart on changes
npm run dev
```

## 🔧 Configuration

### Supported File Types
- `.js` - JavaScript
- `.jsx` - React JSX
- `.ts` - TypeScript  
- `.tsx` - TypeScript JSX

### Parser Features
- ✅ Function declarations
- ✅ Arrow functions
- ✅ Class methods
- ✅ Function calls (dependencies)
- ✅ Cyclomatic complexity calculation
- ✅ ES6+ syntax support

## 📊 Technical Details

### Built With
- **Frontend**: HTML5, CSS3, D3.js v7
- **Backend**: Node.js, Express
- **Parser**: Babel AST parser
- **Visualization**: Force-directed graph simulation

### Key Dependencies
```json
{
  "@babel/parser": "^7.23.0",
  "@babel/traverse": "^7.23.0", 
  "express": "^4.18.2",
  "d3": "^7.8.5"
}
```

## 🎯 Use Cases

- **🧑‍💻 Code Reviews** - Visualize function relationships and complexity
- **📚 Documentation** - Generate visual architecture diagrams  
- **🎓 Onboarding** - Help new developers understand codebases
- **🔍 Refactoring** - Identify complex functions that need attention
- **📈 Technical Debt** - Track complexity growth over time

## 🚧 Roadmap

### v2.0 Planned Features
- [ ] File upload interface
- [ ] Git integration for commit history
- [ ] Export to PNG/SVG
- [ ] Search and filter functions  
- [ ] Multiple programming language support
- [ ] Performance metrics overlay
- [ ] VS Code extension

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Test across different browsers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **D3.js** - For the incredible visualization framework
- **Babel** - For the powerful AST parsing capabilities
- **Express** - For the lightweight server framework
- **Community** - For feedback and contributions

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/lazzerex/codebase-knowledge-map/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/lazzerex/codebase-knowledge-map/discussions)
- 📧 **Email**: nambinh236@gmail.com

---

**⭐ If you find this project useful, please consider giving it a star on GitHub!**