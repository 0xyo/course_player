import type { VideoFile, TreeNode } from '../types';

/**
 * Build a recursive tree from flat video paths.
 *
 * The key insight: we split each video's `folderPath` into path segments,
 * then build a nested structure where a folder node can contain BOTH
 * direct videos (intro videos) AND child folder nodes (lesson subfolders).
 */
export function buildTree(videos: VideoFile[]): TreeNode[] {
  // Sort videos naturally first
  const sorted = [...videos].sort((a, b) =>
    a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' })
  );
  // Re-assign order
  sorted.forEach((v, i) => { v.order = i; });

  // Collect all folder paths and which videos belong where
  // Map: folderPath → VideoFile[]
  const folderVideos = new Map<string, VideoFile[]>();
  sorted.forEach(v => {
    const arr = folderVideos.get(v.folderPath) || [];
    arr.push(v);
    folderVideos.set(v.folderPath, arr);
  });

  // Build tree recursively
  function buildNode(folderPath: string, depth: number): TreeNode | null {
    const segmentName = folderPath.split('/').pop() || folderPath;
    const vids = folderVideos.get(folderPath) || [];

    // Find direct child folders (one level deeper only)
    const childPaths = new Set<string>();
    const prefix = folderPath + '/';
    folderVideos.forEach((_vids, fp) => {
      if (fp.startsWith(prefix)) {
        // Get the immediate child segment
        const remainder = fp.slice(prefix.length);
        const childSegment = remainder.split('/')[0];
        if (childSegment) {
          childPaths.add(prefix + childSegment);
        }
      }
    });

    const children: TreeNode[] = [];
    const sortedChildPaths = [...childPaths].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    for (const cp of sortedChildPaths) {
      const node = buildNode(cp, depth + 1);
      if (node) children.push(node);
    }

    // Only create a node if it has videos or children
    if (vids.length === 0 && children.length === 0) return null;

    return {
      id: `folder-${folderPath}`,
      name: segmentName,
      path: folderPath,
      depth,
      videos: vids.sort((a, b) => a.order - b.order),
      children,
      expanded: true,
    };
  }

  // Find top-level folders (those with no '/' or only one segment)
  const topLevelPaths = new Set<string>();
  folderVideos.forEach((_vids, fp) => {
    const topSegment = fp.split('/')[0];
    topLevelPaths.add(topSegment);
  });

  const roots: TreeNode[] = [];
  const sortedTop = [...topLevelPaths].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  for (const tp of sortedTop) {
    const node = buildNode(tp, 0);
    if (node) roots.push(node);
  }

  return roots;
}

/** Count all videos in a tree node (including children recursively) */
export function countVideos(node: TreeNode): { total: number; watched: number } {
  let total = node.videos.length;
  let watched = node.videos.filter(v => v.watched).length;
  for (const child of node.children) {
    const c = countVideos(child);
    total += c.total;
    watched += c.watched;
  }
  return { total, watched };
}

/** Flatten tree into a video list in order */
export function flattenTree(nodes: TreeNode[]): VideoFile[] {
  const result: VideoFile[] = [];
  function walk(node: TreeNode) {
    result.push(...node.videos);
    for (const child of node.children) walk(child);
  }
  for (const n of nodes) walk(n);
  return result;
}

/** Search tree — filter to only nodes that contain matching videos */
export function searchTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();

  function filterNode(node: TreeNode): TreeNode | null {
    const matchingVideos = node.videos.filter(
      v => v.name.toLowerCase().includes(q) || v.folder.toLowerCase().includes(q)
    );
    const filteredChildren = node.children
      .map(c => filterNode(c))
      .filter((c): c is TreeNode => c !== null);

    if (matchingVideos.length > 0 || filteredChildren.length > 0) {
      return {
        ...node,
        videos: matchingVideos,
        children: filteredChildren,
        expanded: true, // Auto-expand when searching
      };
    }
    return null;
  }

  return nodes.map(n => filterNode(n)).filter((n): n is TreeNode => n !== null);
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatTimeRemaining(seconds: number): string {
  if (!seconds || seconds < 0) return '0m';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
