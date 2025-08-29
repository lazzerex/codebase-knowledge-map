class CodebaseVisualizer {
    constructor() {
        this.data = null;
        this.width = 0;
        this.height = 0;
        this.svg = null;
        this.simulation = null;
        this.tooltip = d3.select('#tooltip');
        
        this.initializeVisualization();
        this.setupEventListeners();
    }

    initializeVisualization() {
        const container = d3.select('#graph-container');
        const containerNode = container.node();
        this.width = containerNode.clientWidth;
        this.height = containerNode.clientHeight;

        
        this.svg = container.select('svg');
        if (this.svg.empty()) {
            this.svg = container.append('svg')
                .attr('width', this.width)
                .attr('height', this.height);
        }

        
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.svg.selectAll('.links, .nodes, .labels')
                    .attr('transform', event.transform);
            });

        this.svg.call(this.zoom);

        
        this.svg.append('defs')
            .append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#666');

        
        this.svg.append('g').attr('class', 'links');
        this.svg.append('g').attr('class', 'nodes');
        this.svg.append('g').attr('class', 'labels');
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.updateDimensions();
        });

        
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch(event.key) {
                    case 'f':
                    case 'F':
                        event.preventDefault();
                        toggleFullscreen();
                        break;
                    case '0':
                        event.preventDefault();
                        this.resetView();
                        break;
                    case '1':
                        event.preventDefault();
                        this.fitToScreen();
                        break;
                }
            }
            
            switch(event.key) {
                case 'Escape':
                    if (document.fullscreenElement || document.body.classList.contains('fullscreen')) {
                        toggleFullscreen();
                    }
                    break;
                case 't':
                case 'T':
                    toggleSidebar();
                    break;
            }
        });
    }

    updateDimensions() {
        const container = d3.select('#graph-container');
        const containerNode = container.node();
        this.width = containerNode.clientWidth;
        this.height = containerNode.clientHeight;
        
        if (this.svg) {
            this.svg.attr('width', this.width).attr('height', this.height);
        }
        
        if (this.simulation) {
            this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
            this.simulation.alpha(0.3).restart();
        }
    }

    loadData(data) {
        this.data = data;
        this.updateStats();
        this.updateSidebar();
        this.createVisualization();
    }

    updateStats() {
        if (!this.data) return;

        const fileCount = this.data.files ? this.data.files.length : 0;
        const functionCount = this.data.allFunctions ? this.data.allFunctions.length : 0;
        const avgComplexity = functionCount > 0 
            ? (this.data.allFunctions.reduce((sum, f) => sum + f.complexity, 0) / functionCount).toFixed(1)
            : '0';

        document.getElementById('file-count').textContent = fileCount;
        document.getElementById('function-count').textContent = functionCount;
        document.getElementById('complexity-count').textContent = avgComplexity;
    }

    updateSidebar() {
        if (!this.data || !this.data.allFunctions) return;

        
        const functionsList = document.getElementById('functions-list');
        functionsList.innerHTML = '';
        
        this.data.allFunctions.forEach(func => {
            const item = document.createElement('div');
            item.className = `function-item ${this.getComplexityClass(func.complexity)}`;
            item.innerHTML = `
                <div class="function-name">${func.name}</div>
                <div class="function-details">
                    ${func.file} • Line ${func.line} • ${func.params.length} params
                    <span class="complexity-badge ${this.getComplexityClass(func.complexity)}">
                        ${func.complexity}
                    </span>
                </div>
            `;
            
            item.addEventListener('click', () => this.highlightFunction(func.name));
            functionsList.appendChild(item);
        });

        
        const hotspotsList = document.getElementById('hotspots-list');
        hotspotsList.innerHTML = '';
        
        const hotspots = this.data.allFunctions
            .filter(f => f.complexity > 3)
            .sort((a, b) => b.complexity - a.complexity)
            .slice(0, 5);

        if (hotspots.length === 0) {
            hotspotsList.innerHTML = '<div style="color: #666; font-style: italic;">No high-complexity functions found</div>';
        } else {
            hotspots.forEach(func => {
                const item = document.createElement('div');
                item.className = 'function-item high-complexity';
                item.innerHTML = `
                    <div class="function-name">🔥 ${func.name}</div>
                    <div class="function-details">
                        Complexity: ${func.complexity} • ${func.file}
                    </div>
                `;
                item.addEventListener('click', () => this.highlightFunction(func.name));
                hotspotsList.appendChild(item);
            });
        }
    }

    getComplexityClass(complexity) {
        if (complexity >= 5) return 'high-complexity';
        if (complexity >= 3) return 'medium-complexity';
        return 'low-complexity';
    }

    createVisualization() {
        if (!this.data || !this.data.allFunctions) return;

        
        d3.select('.empty-state').remove();

        
        this.svg.selectAll('.links').selectAll('*').remove();
        this.svg.selectAll('.nodes').selectAll('*').remove();
        this.svg.selectAll('.labels').selectAll('*').remove();

        
        const nodes = this.data.allFunctions.map(func => ({
            id: func.name,
            ...func,
            radius: Math.max(8, Math.min(20, func.complexity * 3))
        }));

        const links = this.data.allDependencies
            .filter(dep => dep.type === 'call')
            .map(dep => ({
                source: dep.from,
                target: dep.to,
                ...dep
            }))
            .filter(link => 
                nodes.some(n => n.id === link.source) && 
                nodes.some(n => n.id === link.target)
            );

        
        this.simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(80))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(d => d.radius + 5));

        
        const link = this.svg.select('.links')
            .selectAll('.link')
            .data(links)
            .enter().append('line')
            .attr('class', 'link');

        
        const node = this.svg.select('.nodes')
            .selectAll('.node')
            .data(nodes)
            .enter().append('circle')
            .attr('class', 'node')
            .attr('r', d => d.radius)
            .style('fill', d => this.getNodeColor(d.complexity))
            .style('stroke', '#fff')
            .style('stroke-width', 3)
            .on('mouseover', (event, d) => {
                this.showTooltip(event, d);
                
                d3.select(event.currentTarget)
                    .transition()
                    .duration(200)
                    .attr('r', d.radius * 1.2)
                    .style('stroke-width', 4);
            })
            .on('mouseout', (event, d) => {
                this.hideTooltip();
                
                d3.select(event.currentTarget)
                    .transition()
                    .duration(200)
                    .attr('r', d.radius)
                    .style('stroke-width', 3);
            })
            .on('click', (event, d) => this.highlightFunction(d.name))
            .call(d3.drag()
                .on('start', (event, d) => this.dragStart(event, d))
                .on('drag', (event, d) => this.dragDrag(event, d))
                .on('end', (event, d) => this.dragEnd(event, d)));

        
        const label = this.svg.select('.labels')
            .selectAll('.node-label')
            .data(nodes)
            .enter().append('text')
            .attr('class', 'node-label')
            .text(d => d.name.length > 12 ? d.name.substring(0, 10) + '...' : d.name)
            .attr('dy', '0.35em');

        
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });
    }

    getNodeColor(complexity) {
        if (complexity >= 5) return '#f44336';
        if (complexity >= 3) return '#ff9800';
        return '#4CAF50';
    }

    showTooltip(event, d) {
        this.tooltip
            .style('opacity', 1)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .html(`
                <strong>${d.name}</strong><br>
                File: ${d.file}<br>
                Line: ${d.line}<br>
                Parameters: ${d.params.length}<br>
                Complexity: ${d.complexity}<br>
                Type: ${d.type}
            `);
    }

    hideTooltip() {
        this.tooltip.style('opacity', 0);
    }

    highlightFunction(functionName) {
        
        this.svg.selectAll('.node')
            .style('stroke', '#fff')
            .style('stroke-width', 2)
            .style('opacity', 0.3)
            .classed('highlighted', false);

        this.svg.selectAll('.link')
            .style('opacity', 0.1);

        this.svg.selectAll('.node-label')
            .style('opacity', 0.3);

        
        const selectedNode = this.svg.selectAll('.node')
            .filter(d => d.id === functionName);

        if (!selectedNode.empty()) {
            selectedNode
                .style('stroke', '#4CAF50')
                .style('stroke-width', 4)
                .style('opacity', 1)
                .classed('highlighted', true);

            
            const connectedNodeIds = new Set([functionName]);
            
            
            this.svg.selectAll('.link')
                .filter(d => d.source.id === functionName || d.target.id === functionName)
                .style('opacity', 1)
                .style('stroke', '#4CAF50')
                .each(d => {
                    connectedNodeIds.add(d.source.id);
                    connectedNodeIds.add(d.target.id);
                });

            
            this.svg.selectAll('.node')
                .filter(d => connectedNodeIds.has(d.id))
                .style('opacity', 1);

            this.svg.selectAll('.node-label')
                .filter(d => connectedNodeIds.has(d.id))
                .style('opacity', 1);

            
            setTimeout(() => {
                this.svg.selectAll('.node')
                    .style('stroke', '#fff')
                    .style('stroke-width', 2)
                    .style('opacity', 1)
                    .classed('highlighted', false);
                    
                this.svg.selectAll('.link')
                    .style('opacity', 0.6)
                    .style('stroke', '#666');
                    
                this.svg.selectAll('.node-label')
                    .style('opacity', 1);
            }, 3000);
        }
    }

    dragStart(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    dragDrag(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    dragEnd(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    fitToScreen() {
        if (!this.simulation) return;
        
        
        const nodes = this.simulation.nodes();
        if (nodes.length === 0) return;

        
        const xExtent = d3.extent(nodes, d => d.x);
        const yExtent = d3.extent(nodes, d => d.y);
        
        const width = xExtent[1] - xExtent[0];
        const height = yExtent[1] - yExtent[0];
        
        
        const scale = Math.min(this.width / width, this.height / height) * 0.8;
        const translateX = (this.width - width * scale) / 2 - xExtent[0] * scale;
        const translateY = (this.height - height * scale) / 2 - yExtent[0] * scale;
        
        
        const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
        
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, transform);
    }

    resetView() {
        if (!this.svg) return;
        
        const transform = d3.zoomIdentity;
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, transform);
    }
}


let visualizer = null;


document.addEventListener('DOMContentLoaded', function() {
    visualizer = new CodebaseVisualizer();
    
    
    console.log('🗺️ Codebase Knowledge Map ready! Click "Load Data" to begin.');
});


async function loadSampleData() {
    if (!visualizer) return;
    
    try {
        
        d3.select('#graph-container .empty-state').remove();
        d3.select('#graph-container').append('div')
            .attr('class', 'loading')
            .html('🔄 Loading codebase data...');

        const response = await fetch('/api/sample-data');
        const data = await response.json();
        
        console.log('✅ Data loaded:', data.stats);
        visualizer.loadData(data);
        
    } catch (error) {
        console.error('Error loading data:', error);
        
        
        d3.select('#graph-container').html(`
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <div>Error loading data</div>
                <div style="font-size: 0.9rem; margin-top: 0.5rem; color: #666;">
                    Server might be down. Try refreshing the page.
                </div>
            </div>
        `);
    }
}


function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            document.body.classList.add('fullscreen');
            setTimeout(() => visualizer && visualizer.updateDimensions(), 100);
        }).catch(err => {
            console.log('Fullscreen not supported, using CSS fullscreen');
            document.body.classList.toggle('fullscreen');
            setTimeout(() => visualizer && visualizer.updateDimensions(), 100);
        });
    } else {
        document.exitFullscreen().then(() => {
            document.body.classList.remove('fullscreen');
            setTimeout(() => visualizer && visualizer.updateDimensions(), 100);
        });
    }
}

function fitToScreen() {
    if (visualizer) {
        visualizer.fitToScreen();
    }
}

function toggleSidebar() {
    const mainContent = document.querySelector('.main-content');
    mainContent.classList.toggle('sidebar-hidden');
    setTimeout(() => visualizer && visualizer.updateDimensions(), 300);
}

function showHelp() {
    alert(`🚀 Codebase Knowledge Map - Keyboard Shortcuts:

🖱️ Mouse Controls:
• Drag nodes to reposition
• Scroll to zoom in/out
• Click nodes to highlight connections
• Hover for function details

⌨️ Keyboard Shortcuts:
• Ctrl/Cmd + F: Toggle fullscreen
• Ctrl/Cmd + 0: Reset zoom
• Ctrl/Cmd + 1: Fit view to screen
• T: Toggle sidebar
• ESC: Exit fullscreen

🎯 Tips:
• Green nodes = Low complexity (1-2)
• Orange nodes = Medium complexity (3-4)
• Red nodes = High complexity (5+)
• Larger nodes = Higher complexity`);
}