const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const JavaScriptParser = require('./src/parser/javascript-parser');

const app = express();
const PORT = 3000;


app.use(cors());
app.use(express.json());
app.use(express.static('public'));


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'text/javascript' || 
            file.mimetype === 'application/javascript' ||
            file.originalname.match(/\.(js|jsx|ts|tsx)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only JavaScript/TypeScript files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 
    }
});


if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/api/parse', upload.array('files'), (req, res) => {
    console.log('📁 Received file upload request');
    console.log('Files received:', req.files ? req.files.length : 0);
    
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const parser = new JavaScriptParser();
        const results = {
            files: [],
            allFunctions: [],
            allDependencies: [],
            stats: { totalFiles: 0, totalFunctions: 0, totalLines: 0 }
        };

        console.log('🔍 Starting to parse files...');

        req.files.forEach((file, index) => {
            console.log(`📄 Parsing file ${index + 1}/${req.files.length}: ${file.originalname}`);
            
            try {
                const result = parser.parseFile(file.path);
                if (result && result.functions) {
                    results.files.push(result);
                    results.allFunctions.push(...result.functions);
                    results.allDependencies.push(...result.dependencies);
                    console.log(`✅ Parsed ${result.functions.length} functions from ${file.originalname}`);
                } else {
                    console.log(`⚠️  No functions found in ${file.originalname}`);
                }
            } catch (parseError) {
                console.error(`❌ Error parsing ${file.originalname}:`, parseError.message);
            }
        });

        results.stats.totalFiles = results.files.length;
        results.stats.totalFunctions = results.allFunctions.length;
        results.stats.totalLines = Array.from(parser.fileInfo.values())
            .reduce((sum, file) => sum + file.lines, 0);

        console.log('📊 Parse complete:', {
            files: results.stats.totalFiles,
            functions: results.stats.totalFunctions,
            lines: results.stats.totalLines
        });

        
        req.files.forEach(file => {
            try {
                fs.unlinkSync(file.path);
            } catch (err) {
                console.warn(`Warning: Could not delete ${file.path}`);
            }
        });

        res.json(results);
    } catch (error) {
        console.error('❌ Parse error:', error);
        
      
        if (req.files) {
            req.files.forEach(file => {
                try {
                    fs.unlinkSync(file.path);
                } catch (err) {
                    
                }
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to parse files', 
            details: error.message 
        });
    }
});


app.post('/api/parse-directory', (req, res) => {
    try {
        const { directoryPath } = req.body;
        
        if (!directoryPath || !fs.existsSync(directoryPath)) {
            return res.status(400).json({ error: 'Invalid directory path' });
        }

        const parser = new JavaScriptParser();
        const results = parser.parseDirectory(directoryPath);
        
        res.json(results);
    } catch (error) {
        console.error('Parse directory error:', error);
        res.status(500).json({ error: 'Failed to parse directory' });
    }
});

app.get('/api/sample-data', (req, res) => {
    console.log('📋 Sample data requested');
    
    const parser = new JavaScriptParser();
    const samplePath = './test-code';
    
    if (fs.existsSync(samplePath)) {
        try {
            const results = parser.parseDirectory(samplePath);
            console.log('✅ Sample data loaded:', results.stats);
            res.json(results);
        } catch (error) {
            console.error('❌ Error loading sample data:', error);
            res.status(500).json({ error: 'Failed to load sample data' });
        }
    } else {
        console.log('📁 test-code directory not found, using hardcoded sample');
        
        const sampleData = {
            files: [
                {
                    fileName: 'sample.js',
                    functions: [
                        { name: 'calculateTotal', type: 'function', file: 'sample.js', line: 2, params: ['items'], complexity: 3 },
                        { name: 'formatCurrency', type: 'arrow', file: 'sample.js', line: 12, params: ['amount'], complexity: 1 },
                        { name: 'processOrder', type: 'function', file: 'sample.js', line: 16, params: ['order'], complexity: 2 },
                        { name: 'validateOrder', type: 'arrow', file: 'sample.js', line: 27, params: ['order'], complexity: 2 }
                    ],
                    dependencies: [
                        { from: 'calculateTotal', to: 'formatCurrency', file: 'sample.js', line: 9, type: 'call' },
                        { from: 'processOrder', to: 'validateOrder', file: 'sample.js', line: 17, type: 'call' },
                        { from: 'processOrder', to: 'calculateTotal', file: 'sample.js', line: 19, type: 'call' }
                    ]
                }
            ],
            allFunctions: [
                { name: 'calculateTotal', type: 'function', file: 'sample.js', line: 2, params: ['items'], complexity: 3 },
                { name: 'formatCurrency', type: 'arrow', file: 'sample.js', line: 12, params: ['amount'], complexity: 1 },
                { name: 'processOrder', type: 'function', file: 'sample.js', line: 16, params: ['order'], complexity: 2 },
                { name: 'validateOrder', type: 'arrow', file: 'sample.js', line: 27, params: ['order'], complexity: 2 }
            ],
            allDependencies: [
                { from: 'calculateTotal', to: 'formatCurrency', file: 'sample.js', line: 9, type: 'call' },
                { from: 'processOrder', to: 'validateOrder', file: 'sample.js', line: 17, type: 'call' },
                { from: 'processOrder', to: 'calculateTotal', file: 'sample.js', line: 19, type: 'call' }
            ],
            stats: {
                totalFiles: 1,
                totalFunctions: 4,
                totalLines: 35
            }
        };
        res.json(sampleData);
    }
});


app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Codebase Knowledge Map server running on http://localhost:${PORT}`);
    console.log(`📁 Upload files or analyze directories through the web interface`);
    console.log(`🧪 Test with: node test-parser.js`);
});

module.exports = app;