import React, { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import { useNavigate } from 'react-router-dom';
import { Filter, Maximize2, Minimize2, Sparkles, Box, Circle, Search, X, ChevronRight } from 'lucide-react';
import { graphAPI } from '../services/api';
import LoadingScreen from '../components/LoadingScreen';
import { useTheme } from '../context/ThemeContext';
import * as d3 from 'd3';
import * as THREE from 'three';

const KnowledgeGraph = () => {
    const navigate = useNavigate();
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [originalData, setOriginalData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [is3D, setIs3D] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [neighborNodes, setNeighborNodes] = useState(new Set());
    const [neighborLinks, setNeighborLinks] = useState(new Set());
    const { theme } = useTheme();
    const fgRef = useRef();

    useEffect(() => {
        fetchGraphData();
    }, []);

    // Filter logic
    useEffect(() => {
        if (!originalData.nodes.length) return;

        let filteredNodes = originalData.nodes;

        // Search filter
        if (searchQuery) {
            filteredNodes = filteredNodes.filter(node =>
                node.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Tag filter
        if (selectedTags.length > 0) {
            filteredNodes = filteredNodes.filter(node =>
                node.tags && node.tags.some(tag => selectedTags.includes(tag))
            );
        }

        const nodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredLinks = originalData.links.filter(link =>
            nodeIds.has(link.source.id || link.source) && nodeIds.has(link.target.id || link.target)
        );

        setGraphData({
            nodes: filteredNodes,
            links: filteredLinks
        });
    }, [searchQuery, selectedTags, originalData]);

    const fetchGraphData = async () => {
        setLoading(true);
        try {
            const response = await graphAPI.getGraph();
            const { nodes, edges } = response.data;

            // Transform data for react-force-graph format
            const graphNodes = (nodes || []).map(node => ({
                id: node.id || node._id,
                name: node.title || 'Untitled Note',
                icon: node.icon || '📄',
                tags: node.tags || [],
                projectId: node.projectId,
                projectColor: node.projectColor || '#2563EB',
                val: 10, // Node size
            }));

            const graphLinks = edges.map(edge => ({
                source: edge.source,
                target: edge.target,
                type: edge.type,
                strength: edge.strength,
                color: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            }));

            setOriginalData({ nodes: graphNodes, links: graphLinks });
            setGraphData({ nodes: graphNodes, links: graphLinks });

            // Extract unique tags
            const allTags = new Set();
            nodes.forEach(n => n.tags?.forEach(t => allTags.add(t)));
            setAvailableTags(Array.from(allTags));

        } finally {
            setLoading(false);
        }
    };


    const handleNodeClick = useCallback((node) => {
        setSelectedNode(node);
        setDrawerOpen(true);
    }, []);

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleGenerateSemanticLinks = async () => {
        if (!selectedNode) {
            alert('Please select a node first by clicking on it!');
            return;
        }

        try {
            const response = await graphAPI.generateSemanticLinks(selectedNode.id);
            fetchGraphData(); // Refresh graph
            alert(`Successfully generated ${response.data?.linksCreated || 0} new semantic links!`);
        } catch (error) {
            console.error('Error generating semantic links:', error);
            alert('Failed to generate semantic links. Please try again.');
        }
    };

    const handleNodeHover = (node) => {
        setHoveredNode(node);
        const neighbors = new Set();
        const links = new Set();
        if (node) {
            neighbors.add(node.id);
            originalData.links.forEach(link => {
                if (link.source.id === node.id || link.source === node.id) {
                    neighbors.add(link.target.id || link.target);
                    links.add(link);
                } else if (link.target.id === node.id || link.target === node.id) {
                    neighbors.add(link.source.id || link.source);
                    links.add(link);
                }
            });
        }
        setNeighborNodes(neighbors);
        setNeighborLinks(links);
    };

    // Apply physics forces
    useEffect(() => {
        if (!fgRef.current) return;

        const fg = fgRef.current;

        if (is3D) {
            // 3D Forces - Tightened to reduce scattering
            fg.d3Force('link').distance(30).strength(0.8); // Shorter distance, stronger pull
            fg.d3Force('charge').strength(-60); // Weaker repulsion for tighter clustering
            fg.d3Force('center', d3.forceCenter());

            // Add radial clustering force like 2D
            fg.d3Force('radial', d3.forceRadial(0).strength(0.08)); // Pulls nodes toward center

            // Tighter bounding force for 3D
            fg.d3Force('box', () => {
                graphData.nodes.forEach(node => {
                    const bound = 250; // Reduced from 500 for tighter bounds
                    if (node.x < -bound) node.x = -bound;
                    if (node.x > bound) node.x = bound;
                    if (node.y < -bound) node.y = -bound;
                    if (node.y > bound) node.y = bound;
                    if (node.z < -bound) node.z = -bound;
                    if (node.z > bound) node.z = bound;
                });
            });
        } else {
            // 2D Forces
            fg.d3Force('link').distance(45).strength(0.7); // Stronger links to pull nodes together
            fg.d3Force('charge').strength(-80); // Moderate repulsion
            fg.d3Force('center', d3.forceCenter());
            fg.d3Force('radial', d3.forceRadial(0).strength(0.05)); // Subtle radial force to keep disconnected nodes clustered

            // Bounding force to keep nodes within view
            const padding = 100;
            fg.d3Force('box', () => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                graphData.nodes.forEach(node => {
                    const xBound = width / 2 - padding;
                    const yBound = height / 2 - padding;
                    if (node.x < -xBound) node.x = -xBound;
                    if (node.x > xBound) node.x = xBound;
                    if (node.y < -yBound) node.y = -yBound;
                    if (node.y > yBound) node.y = yBound;
                });
            });
        }
    }, [graphData, is3D]);

    const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
        const isNeighbor = neighborNodes.size === 0 || neighborNodes.has(node.id);
        const opacity = isNeighbor ? 1 : 0.1;

        ctx.globalAlpha = opacity;
        const nodeColor = theme === 'dark' ? '#ffffff' : '#000000';
        const highlightColor = '#2563EB';

        const label = node.name;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;

        // Draw node circle
        ctx.beginPath();
        const radius = hoveredNode && hoveredNode.id === node.id ? 7 : 5;
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isNeighbor && hoveredNode ? highlightColor : nodeColor;
        ctx.fill();

        // Draw icon
        if (node.icon) {
            ctx.font = `${fontSize * 1.5}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.icon, node.x, node.y);
        }

        // Draw label
        if (isNeighbor) {
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = theme === 'dark' ? '#94a3b8' : '#64748b';
            ctx.fillText(label, node.x, node.y + 12);
        }
        ctx.globalAlpha = 1;
    }, [neighborNodes, hoveredNode, theme]);

    const nodeThreeObject = useCallback((node) => {
        const isNeighbor = neighborNodes.size === 0 || neighborNodes.has(node.id);

        // Create Sparkle ✨ group
        const sparkle = new THREE.Group();

        // Main star shape - WHITE color
        const starShape = new THREE.Shape();
        const outerRadius = 3.5;
        const innerRadius = 1.2;
        const points = 4;

        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) starShape.moveTo(x, y);
            else starShape.lineTo(x, y);
        }
        starShape.closePath();

        const extrudeSettings = { depth: 0.8, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.3, bevelThickness: 0.2 };
        const geometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
        const mainMaterial = new THREE.MeshLambertMaterial({
            color: '#ffffff', // White main star
            transparent: true,
            opacity: isNeighbor ? 1 : 0.5,
            emissive: isNeighbor ? '#ffffff' : '#888888',
            emissiveIntensity: isNeighbor ? 0.6 : 0.2
        });

        const mainStar = new THREE.Mesh(geometry, mainMaterial);
        sparkle.add(mainStar);

        // Orbiting tiny star container
        const orbitGroup = new THREE.Group();
        sparkle.add(orbitGroup);

        // Create single tiny orbiting STAR ⭐ - 5 pointed
        const tinyStarShape = new THREE.Shape();
        const tinyOuter = 0.6;
        const tinyInner = 0.25;
        const starPoints = 5;

        for (let i = 0; i < starPoints * 2; i++) {
            const radius = i % 2 === 0 ? tinyOuter : tinyInner;
            const angle = (i / (starPoints * 2)) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) tinyStarShape.moveTo(x, y);
            else tinyStarShape.lineTo(x, y);
        }
        tinyStarShape.closePath();

        const tinyGeometry = new THREE.ExtrudeGeometry(tinyStarShape, { depth: 0.3, bevelEnabled: false });
        const tinyMaterial = new THREE.MeshLambertMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 0.9,
            emissive: '#ffffff',
            emissiveIntensity: 0.8
        });

        const tinyStar = new THREE.Mesh(tinyGeometry, tinyMaterial);
        tinyStar.position.set(6, 0, 0); // Orbit radius of 6
        orbitGroup.add(tinyStar);

        // Add continuous rotation animation
        if (!node.__rotationInterval) {
            node.__rotationInterval = setInterval(() => {
                if (sparkle && !sparkle.__disposed) {
                    mainStar.rotation.z += 0.015; // Main star slow rotation
                    orbitGroup.rotation.z += 0.05; // Tiny sparkles orbit faster
                    orbitGroup.rotation.y += 0.02;
                }
            }, 50);
        }

        return sparkle;
    }, [neighborNodes, theme]);

    // Cleanup intervals on unmount or data change
    useEffect(() => {
        return () => {
            originalData.nodes.forEach(node => {
                if (node.__rotationInterval) {
                    clearInterval(node.__rotationInterval);
                    delete node.__rotationInterval;
                }
            });
        };
    }, [originalData]);

    if (loading) return <LoadingScreen />;

    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-[9999]' : 'h-full'} bg-[var(--background)] flex flex-col overflow-hidden relative`}>
            {/* Header */}
            <div className="bg-[var(--card)] border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-heading font-bold text-[var(--foreground)]">
                            Knowledge Graph
                        </h1>
                        <div className="text-[var(--muted-foreground)] text-sm hidden md:block">
                            {graphData.nodes.length} nodes • {graphData.links.length} connections
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search nodes by title..."
                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleGenerateSemanticLinks}
                        className="btn flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Generate AI Links
                    </button>

                    <button
                        onClick={() => setIs3D(!is3D)}
                        className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        title={is3D ? "Switch to 2D" : "Switch to 3D"}
                    >
                        {is3D ? <Circle className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
                    >
                        {isFullscreen ? (
                            <Minimize2 className="w-5 h-5 text-[var(--muted-foreground)]" />
                        ) : (
                            <Maximize2 className="w-5 h-5 text-[var(--muted-foreground)]" />
                        )}
                    </button>
                </div>
            </div>

            {/* Tag Filters */}
            {availableTags.length > 0 && (
                <div className="bg-[var(--background)] border-b border-[var(--card-border)] px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar z-10">
                    <Filter className="w-4 h-4 text-[var(--muted-foreground)] mr-2" />
                    {availableTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${selectedTags.includes(tag)
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md'
                                : 'bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--card-border)] hover:border-[var(--muted-foreground)]'
                                }`}
                        >
                            #{tag}
                        </button>
                    ))}
                    {selectedTags.length > 0 && (
                        <button
                            onClick={() => setSelectedTags([])}
                            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] ml-2"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            )}

            {/* Graph Canvas */}
            <div className="flex-1 relative overflow-hidden" key={is3D ? '3d-view' : '2d-view'}>
                {is3D ? (
                    <ForceGraph3D
                        ref={fgRef}
                        graphData={graphData}
                        nodeId="id"
                        nodeLabel="name"
                        nodeThreeObject={nodeThreeObject}
                        nodeResolution={24}
                        onNodeClick={handleNodeClick}
                        onNodeHover={handleNodeHover}
                        linkColor={link => neighborLinks.has(link) ? '#2563EB' : (theme === 'dark' ? 'rgba(150,150,150,0.4)' : 'rgba(100,100,100,0.4)')}
                        linkWidth={link => neighborLinks.has(link) ? 2 : 0.5}
                        linkDirectionalParticles={2}
                        linkDirectionalParticleSpeed={0.003}
                        linkCurvature={0.5}
                        linkOpacity={0.4}
                        onNodeDrag={node => {
                            fgRef.current.d3ReheatSimulation();
                            node.fx = node.x;
                            node.fy = node.y;
                            node.fz = node.z;
                        }}
                        onNodeDragEnd={node => {
                            node.fx = node.x;
                            node.fy = node.y;
                            node.fz = node.z;
                        }}
                        onNodeDoubleClick={node => {
                            node.fx = undefined;
                            node.fy = undefined;
                            node.fz = undefined;
                        }}
                        backgroundColor={theme === 'dark' ? '#000000' : '#f8fafc'}
                    />
                ) : (
                    <ForceGraph2D
                        ref={fgRef}
                        graphData={graphData}
                        nodeId="id"
                        nodeLabel="name"
                        nodeCanvasObject={nodeCanvasObject}
                        onNodeClick={handleNodeClick}
                        onNodeHover={handleNodeHover}
                        linkColor={link => neighborLinks.has(link) ? '#2563EB' : (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')}
                        linkWidth={link => neighborLinks.has(link) ? 2 : 0.5}
                        linkDirectionalParticles={neighborLinks.size > 0 ? 1 : 0}
                        linkDirectionalParticleWidth={1.5}
                        linkCurvature={0.1}
                        onNodeDrag={node => {
                            fgRef.current.d3AlphaTarget(0.3).restart();
                            node.fx = node.x;
                            node.fy = node.y;
                        }}
                        onNodeDragEnd={node => {
                            fgRef.current.d3AlphaTarget(0);
                            node.fx = node.x;
                            node.fy = node.y;
                        }}
                        onNodeDoubleClick={node => {
                            node.fx = undefined;
                            node.fy = undefined;
                        }}
                        backgroundColor={theme === 'dark' ? '#000000' : '#f8fafc'}
                        cooldownTicks={100}
                    />
                )}

                {/* Detail Drawer */}
                {drawerOpen && selectedNode && (
                    <div className="absolute top-4 right-4 bottom-4 w-80 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl z-30 flex flex-col transform animate-in slide-in-from-right duration-300">
                        <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between">
                            <h3 className="font-bold text-[var(--foreground)] truncate pr-4">Node Details</h3>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="p-1.5 hover:bg-[var(--secondary)] rounded-lg text-[var(--muted-foreground)] transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl shadow-inner bg-[var(--secondary)]">
                                    {selectedNode.icon || '📝'}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-[var(--foreground)] leading-tight">{selectedNode.name}</h4>
                                    <span className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-bold">Note Node</span>
                                </div>
                            </div>

                            {selectedNode.tags && selectedNode.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {selectedNode.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-[var(--background)] border border-[var(--card-border)] rounded text-[10px] text-[var(--muted-foreground)]">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                                    <p className="text-xs text-[var(--muted-foreground)] mb-2 uppercase font-bold tracking-tight">Connected via Project</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.projectColor }}></div>
                                        <span className="text-sm font-medium">{selectedNode.projectId || 'Personal'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-[var(--secondary)] border-t border-[var(--card-border)] rounded-b-2xl">
                            <button
                                onClick={() => navigate(`/notes/${selectedNode.id}`)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/20"
                            >
                                Open Note Content
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>


            {/* Instructions */}
            {graphData.nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-[var(--muted-foreground)]">
                        <p className="text-lg mb-2">No notes yet</p>
                        <p className="text-sm">Create some notes to see your knowledge graph</p>
                    </div>
                </div>
            )}
        </div>
    );
};


export default KnowledgeGraph;
