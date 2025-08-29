const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const path = require('path');

class JavaScriptParser {
    constructor() {
        this.functions = new Map();
        this.dependencies = [];
        this.fileInfo = new Map();
    }

    parseFile(filePath) {
        try {
            const code = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            
            
            const ast = parser.parse(code, {
                sourceType: 'module',
                plugins: [
                    'jsx', 
                    'typescript', 
                    'classProperties',
                    'decorators-legacy',
                    'objectRestSpread',
                    'asyncGenerators',
                    'dynamicImport'
                ]
            });

            
            this.fileInfo.set(fileName, {
                path: filePath,
                size: code.length,
                lines: code.split('\n').length
            });

            
            this.traverseAST(ast, fileName);
            
            return {
                fileName,
                functions: Array.from(this.functions.values()).filter(f => f.file === fileName),
                dependencies: this.dependencies.filter(d => d.file === fileName)
            };
        } catch (error) {
            console.error(`Error parsing ${filePath}:`, error.message);
            
            return {
                fileName: path.basename(filePath),
                functions: [],
                dependencies: []
            };
        }
    }

    traverseAST(ast, fileName) {
        traverse(ast, {
            
            FunctionDeclaration: (path) => {
                const node = path.node;
                this.addFunction({
                    name: node.id ? node.id.name : 'anonymous',
                    type: 'function',
                    file: fileName,
                    line: node.loc ? node.loc.start.line : 0,
                    params: this.extractParameters(node.params),
                    complexity: this.calculateComplexity(path)
                });
            },

            
            ClassMethod: (path) => {
                const node = path.node;
                const className = this.getClassName(path);
                const methodName = node.key ? (node.key.name || node.key.value || 'unknown') : 'unknown';
                const fullName = className ? `${className}.${methodName}` : methodName;
                
                this.addFunction({
                    name: fullName,
                    type: node.kind === 'constructor' ? 'constructor' : 'method',
                    file: fileName,
                    line: node.loc ? node.loc.start.line : 0,
                    params: this.extractParameters(node.params),
                    complexity: this.calculateComplexity(path)
                });
            },

            
            VariableDeclarator: (path) => {
                const node = path.node;
                if (node.init && (node.init.type === 'ArrowFunctionExpression' || 
                                 node.init.type === 'FunctionExpression')) {
                    this.addFunction({
                        name: node.id ? node.id.name : 'anonymous',
                        type: node.init.type === 'ArrowFunctionExpression' ? 'arrow' : 'function',
                        file: fileName,
                        line: node.loc ? node.loc.start.line : 0,
                        params: this.extractParameters(node.init.params),
                        complexity: this.calculateComplexity(path)
                    });
                }
            },

            
            CallExpression: (path) => {
                const node = path.node;
                let calledFunction = '';
                
                if (node.callee.type === 'Identifier') {
                    calledFunction = node.callee.name;
                } else if (node.callee.type === 'MemberExpression') {
                    calledFunction = this.getMemberExpressionName(node.callee);
                }

                if (calledFunction && calledFunction !== 'require' && !this.isBuiltinFunction(calledFunction)) {
                    this.dependencies.push({
                        from: this.getCurrentFunction(path),
                        to: calledFunction,
                        file: fileName,
                        line: node.loc ? node.loc.start.line : 0,
                        type: 'call'
                    });
                }
            },

            
            ImportDeclaration: (path) => {
                const node = path.node;
                if (node.specifiers && node.source) {
                    node.specifiers.forEach(spec => {
                        this.dependencies.push({
                            from: fileName,
                            to: node.source.value,
                            file: fileName,
                            line: node.loc ? node.loc.start.line : 0,
                            type: 'import',
                            imported: spec.imported ? spec.imported.name : 'default'
                        });
                    });
                }
            }
        });
    }

    addFunction(funcInfo) {
        const key = `${funcInfo.file}:${funcInfo.name}`;
        this.functions.set(key, funcInfo);
    }

    extractParameters(params) {
        if (!params) return [];
        
        return params.map(param => {
            if (param.type === 'Identifier') {
                return param.name;
            } else if (param.type === 'RestElement') {
                return `...${param.argument.name}`;
            } else if (param.type === 'AssignmentPattern') {
                return param.left.name + '=default';
            } else if (param.type === 'ObjectPattern') {
                return '{destructured}';
            } else if (param.type === 'ArrayPattern') {
                return '[destructured]';
            } else {
                return 'complex';
            }
        });
    }

    calculateComplexity(path) {
        
        let complexity = 1;
        
        try {
            path.traverse({
                IfStatement: () => { complexity++; },
                WhileStatement: () => { complexity++; },
                ForStatement: () => { complexity++; },
                DoWhileStatement: () => { complexity++; },
                SwitchCase: () => { complexity++; },
                ConditionalExpression: () => { complexity++; },
                LogicalExpression: (subPath) => {
                    
                    if (subPath.node.operator === '&&' || subPath.node.operator === '||') {
                        complexity++;
                    }
                },
                CatchClause: () => { complexity++; },
                ForInStatement: () => { complexity++; },
                ForOfStatement: () => { complexity++; }
            });
        } catch (error) {
            console.warn(`Warning: Could not calculate complexity for function: ${error.message}`);
        }

        return complexity;
    }

    getMemberExpressionName(node) {
        try {
            if (node.object && node.object.type === 'Identifier' && node.property) {
                const objectName = node.object.name;
                const propertyName = node.property.name || node.property.value;
                return `${objectName}.${propertyName}`;
            }
        } catch (error) {
            
        }
        return 'complex.method';
    }

    getCurrentFunction(path) {
        let current = path;
        while (current) {
            
            if (current.isFunctionDeclaration && current.isFunctionDeclaration()) {
                return current.node.id ? current.node.id.name : 'anonymous';
            }
            
            
            if ((current.isArrowFunctionExpression && current.isArrowFunctionExpression()) || 
                (current.isFunctionExpression && current.isFunctionExpression())) {
                
                const parent = current.parent;
                if (parent && parent.type === 'VariableDeclarator' && parent.id) {
                    return parent.id.name;
                }
                return 'anonymous';
            }
            
            
            if (current.isClassMethod && current.isClassMethod()) {
                const methodName = current.node.key ? (current.node.key.name || current.node.key.value || 'unknown') : 'unknown';
                const className = this.getClassName(current);
                return className ? `${className}.${methodName}` : methodName;
            }
            
            current = current.parentPath;
        }
        return 'global';
    }

    getClassName(path) {
        let current = path;
        while (current) {
            if ((current.isClassDeclaration && current.isClassDeclaration()) || 
                (current.isClassExpression && current.isClassExpression())) {
                return current.node.id ? current.node.id.name : 'AnonymousClass';
            }
            current = current.parentPath;
        }
        return null;
    }

    isBuiltinFunction(name) {
        
        const builtins = new Set([
            'console', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
            'encodeURIComponent', 'decodeURIComponent', 'setTimeout', 'clearTimeout',
            'setInterval', 'clearInterval', 'JSON', 'Math', 'Date', 'Array',
            'Object', 'String', 'Number', 'Boolean', 'RegExp', 'Error',
            'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'indexOf',
            'forEach', 'map', 'filter', 'reduce', 'find', 'some', 'every',
            'join', 'split', 'replace', 'match', 'search', 'substring',
            'toLowerCase', 'toUpperCase', 'trim', 'length'
        ]);
        
        return builtins.has(name) || builtins.has(name.split('.')[0]);
    }

    parseDirectory(dirPath) {
        const results = {
            files: [],
            allFunctions: [],
            allDependencies: [],
            stats: {
                totalFiles: 0,
                totalFunctions: 0,
                totalLines: 0
            }
        };

        const files = this.getJavaScriptFiles(dirPath);
        
        files.forEach(filePath => {
            const result = this.parseFile(filePath);
            
            results.files.push(result);
            results.allFunctions.push(...result.functions);
            results.allDependencies.push(...result.dependencies);
        });

        results.stats.totalFiles = results.files.length;
        results.stats.totalFunctions = results.allFunctions.length;
        results.stats.totalLines = Array.from(this.fileInfo.values())
            .reduce((sum, file) => sum + file.lines, 0);

        return results;
    }

    getJavaScriptFiles(dir) {
        let files = [];
        
        try {
            const items = fs.readdirSync(dir);

            items.forEach(item => {
                const fullPath = path.join(dir, item);
                
                try {
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        files.push(...this.getJavaScriptFiles(fullPath));
                    } else if (item.match(/\.(js|jsx|ts|tsx)$/)) {
                        files.push(fullPath);
                    }
                } catch (error) {
                    console.warn(`Warning: Could not stat ${fullPath}: ${error.message}`);
                }
            });
        } catch (error) {
            console.error(`Error reading directory ${dir}: ${error.message}`);
        }

        return files;
    }
}

module.exports = JavaScriptParser;