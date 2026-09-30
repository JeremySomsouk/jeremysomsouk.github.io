//! Deterministic positive-cost pathfinding. No DOM, clocks, randomness or host imports.
use std::{cell::RefCell, cmp::Reverse, collections::BinaryHeap};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Node {
    pub x: u32,
    pub y: u32,
    /// Entering this node costs this amount. None means unavailable.
    pub cost: Option<u32>,
    pub neighbors: Vec<usize>,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Graph {
    pub nodes: Vec<Node>,
    pub start: usize,
    pub target: usize,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Algorithm {
    Dijkstra,
    AStar,
}
/// Stable event codes are also the raw Wasm ABI. CostUpdated includes predecessor.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Kind {
    Started = 0,
    Selected = 1,
    Frontier = 2,
    Visited = 3,
    CostUpdated = 4,
    Heuristic = 5,
    Reached = 6,
    Path = 7,
    Unreachable = 8,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Event {
    pub kind: Kind,
    pub node: usize,
    pub cost: u32,
    pub predecessor: usize,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Run {
    pub events: Vec<Event>,
    pub path: Vec<usize>,
    pub cost: Option<u32>,
    pub explored: usize,
}

/// A* uses Manhattan distance only when every edge is a unit grid edge;
/// otherwise zero is a safe heuristic for an arbitrary graph. All costs are >=1.
fn heuristic(graph: &Graph, algorithm: Algorithm) -> impl Fn(usize) -> u32 + '_ {
    let grid = algorithm == Algorithm::AStar
        && graph.nodes.iter().all(|node| {
            node.neighbors.iter().all(|&i| {
                graph
                    .nodes
                    .get(i)
                    .is_some_and(|other| node.x.abs_diff(other.x) + node.y.abs_diff(other.y) == 1)
            })
        });
    move |i| {
        if grid {
            let n = &graph.nodes[i];
            let t = &graph.nodes[graph.target];
            n.x.abs_diff(t.x) + n.y.abs_diff(t.y)
        } else {
            0
        }
    }
}

pub fn search(graph: &Graph, algorithm: Algorithm) -> Run {
    let mut run = Run {
        events: Vec::new(),
        path: Vec::new(),
        cost: None,
        explored: 0,
    };
    let mut emit = |kind, node, cost, predecessor| {
        run.events.push(Event {
            kind,
            node,
            cost,
            predecessor,
        })
    };
    emit(Kind::Started, graph.start, 0, graph.start);
    let n = graph.nodes.len();
    if graph.start >= n
        || graph.target >= n
        || graph
            .nodes
            .iter()
            .any(|node| node.cost == Some(0) || node.neighbors.iter().any(|&i| i >= n))
        || graph.nodes[graph.start].cost.is_none()
        || graph.nodes[graph.target].cost.is_none()
    {
        emit(Kind::Unreachable, graph.target, 0, graph.target);
        return run;
    }
    let h = heuristic(graph, algorithm);
    let mut distances = vec![u32::MAX; n];
    let mut parents = vec![None; n];
    let mut visited = vec![false; n];
    // Deterministic tie-breaking by cost then node index, independent of hash order.
    let mut open = BinaryHeap::new();
    distances[graph.start] = 0;
    open.push(Reverse((h(graph.start), 0, graph.start)));
    run.events.push(Event {
        kind: Kind::Frontier,
        node: graph.start,
        cost: 0,
        predecessor: graph.start,
    });
    while let Some(Reverse((_, cost, current))) = open.pop() {
        if visited[current] || distances[current] != cost {
            continue;
        }
        run.events.push(Event {
            kind: Kind::Selected,
            node: current,
            cost,
            predecessor: parents[current].unwrap_or(current),
        });
        visited[current] = true;
        run.explored += 1;
        run.events.push(Event {
            kind: Kind::Visited,
            node: current,
            cost,
            predecessor: parents[current].unwrap_or(current),
        });
        if current == graph.target {
            run.cost = Some(cost);
            run.events.push(Event {
                kind: Kind::Reached,
                node: current,
                cost,
                predecessor: current,
            });
            let mut i = current;
            run.path.push(i);
            while let Some(parent) = parents[i] {
                i = parent;
                run.path.push(i);
            }
            run.path.reverse();
            for &i in &run.path {
                run.events.push(Event {
                    kind: Kind::Path,
                    node: i,
                    cost: distances[i],
                    predecessor: parents[i].unwrap_or(i),
                });
            }
            return run;
        }
        for &next in &graph.nodes[current].neighbors {
            let Some(weight) = graph.nodes[next].cost else {
                continue;
            };
            let Some(candidate) = cost.checked_add(weight) else {
                continue;
            };
            if visited[next] || candidate >= distances[next] {
                continue;
            }
            distances[next] = candidate;
            parents[next] = Some(current);
            run.events.push(Event {
                kind: Kind::CostUpdated,
                node: next,
                cost: candidate,
                predecessor: current,
            });
            run.events.push(Event {
                kind: Kind::Heuristic,
                node: next,
                cost: h(next),
                predecessor: current,
            });
            run.events.push(Event {
                kind: Kind::Frontier,
                node: next,
                cost: candidate,
                predecessor: current,
            });
            open.push(Reverse((
                candidate.saturating_add(h(next)),
                candidate,
                next,
            )));
        }
    }
    run.events.push(Event {
        kind: Kind::Unreachable,
        node: graph.target,
        cost: 0,
        predecessor: graph.target,
    });
    run
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Level {
    pub seed: u32,
    pub graph: Graph,
    pub budget: usize,
    pub checkpoint: usize,
    pub width: usize,
}
impl Level {
    pub fn weighted(seed: u32) -> Self {
        let width = 7;
        let mut nodes = Vec::new();
        for y in 0..5 {
            for x in 0..width {
                let cost = if y == 1 || y == 3 || (y == 2 && (x == 0 || x == 6)) {
                    Some(1)
                } else {
                    None
                };
                let i = y * width + x;
                let mut neighbors = Vec::new();
                if x > 0 {
                    neighbors.push(i - 1);
                }
                if x + 1 < width {
                    neighbors.push(i + 1);
                }
                if y > 0 {
                    neighbors.push(i - width);
                }
                if y < 4 {
                    neighbors.push(i + width);
                }
                nodes.push(Node {
                    x: x as u32,
                    y: y as u32,
                    cost,
                    neighbors,
                });
            }
        }
        nodes[10].cost = Some(3);
        nodes[24].cost = Some(8 + seed % 3);
        Self {
            seed,
            graph: Graph {
                nodes,
                start: 14,
                target: 20,
            },
            budget: 2,
            checkpoint: 24,
            width,
        }
    }
    pub fn homepage() -> Self {
        let nodes = [
            (0, 0, 1, vec![1, 3]),
            (1, 0, 1, vec![0, 2]),
            (2, 0, 3, vec![1, 5]),
            (0, 1, 9, vec![0, 4]),
            (1, 1, 1, vec![3, 5]),
            (2, 1, 1, vec![2, 4]),
        ]
        .into_iter()
        .map(|(x, y, cost, neighbors)| Node {
            x,
            y,
            cost: Some(cost),
            neighbors,
        })
        .collect();
        Self {
            seed: 0,
            graph: Graph {
                nodes,
                start: 0,
                target: 5,
            },
            budget: 1,
            checkpoint: 3,
            width: 0,
        }
    }
}
#[derive(Clone)]
pub struct Game {
    pub level: Level,
    pub graph: Graph,
    history: Vec<(usize, Option<u32>)>,
    pub algorithm: Algorithm,
}
impl Game {
    pub fn new(level: Level) -> Self {
        Self {
            graph: level.graph.clone(),
            level,
            history: Vec::new(),
            algorithm: Algorithm::Dijkstra,
        }
    }
    pub fn used(&self) -> usize {
        self.history.len()
    }
    /// One action spends one intervention, including a repeat edit. Undo refunds it.
    pub fn change(&mut self, node: usize, block: bool) -> bool {
        if node >= self.graph.nodes.len()
            || node == self.graph.start
            || node == self.graph.target
            || self.level.graph.nodes[node].cost.is_none()
            || self.used() >= self.level.budget
        {
            return false;
        }
        let old = self.graph.nodes[node].cost;
        let new = if block {
            if old.is_some() {
                None
            } else {
                self.level.graph.nodes[node].cost
            }
        } else {
            Some(if old == Some(1) { 9 } else { 1 })
        };
        self.history.push((node, old));
        self.graph.nodes[node].cost = new;
        true
    }
    pub fn undo(&mut self) -> bool {
        if let Some((i, cost)) = self.history.pop() {
            self.graph.nodes[i].cost = cost;
            true
        } else {
            false
        }
    }
    pub fn reset(&mut self) {
        self.graph = self.level.graph.clone();
        self.history.clear();
    }
    pub fn run(&self) -> Run {
        search(&self.graph, self.algorithm)
    }
    pub fn solved(&self, run: &Run) -> bool {
        self.used() > 0 && run.cost.is_some() && run.path.contains(&self.level.checkpoint)
    }
}

// Small raw ABI follows the existing Memory game's Wasm integration. The JS
// adapter copies immutable event records; no renderer state exists in the engine.
thread_local! { static STATE: RefCell<(Game, Run)> = RefCell::new({ let game = Game::new(Level::homepage()); let run = game.run(); (game,run) }); }
#[unsafe(no_mangle)]
pub extern "C" fn init(home: u32, seed: u32) {
    STATE.with(|s| {
        let game = Game::new(if home != 0 {
            Level::homepage()
        } else {
            Level::weighted(seed)
        });
        let run = game.run();
        *s.borrow_mut() = (game, run);
    });
}
#[unsafe(no_mangle)]
pub extern "C" fn change(node: u32, block: u32) -> u32 {
    STATE.with(|s| {
        let mut s = s.borrow_mut();
        let ok = s.0.change(node as usize, block != 0);
        s.1 = s.0.run();
        u32::from(ok)
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn undo() -> u32 {
    STATE.with(|s| {
        let mut s = s.borrow_mut();
        let ok = s.0.undo();
        s.1 = s.0.run();
        u32::from(ok)
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn reset() {
    STATE.with(|s| {
        let mut s = s.borrow_mut();
        s.0.reset();
        s.1 = s.0.run();
    });
}
#[unsafe(no_mangle)]
pub extern "C" fn algorithm(astar: u32) {
    STATE.with(|s| {
        let mut s = s.borrow_mut();
        s.0.algorithm = if astar == 0 {
            Algorithm::Dijkstra
        } else {
            Algorithm::AStar
        };
        s.1 = s.0.run();
    });
}
/// Fields: node count, start, target, checkpoint, budget, used, cost, explored,
/// solved, event count. u32::MAX is the absent/unreachable sentinel.
#[unsafe(no_mangle)]
pub extern "C" fn info(field: u32) -> u32 {
    STATE.with(|s| {
        let s = s.borrow();
        let (game, run) = &*s;
        match field {
            0 => game.graph.nodes.len() as u32,
            1 => game.graph.start as u32,
            2 => game.graph.target as u32,
            3 => game.level.checkpoint as u32,
            4 => game.level.budget as u32,
            5 => game.used() as u32,
            6 => run.cost.unwrap_or(u32::MAX),
            7 => run.explored as u32,
            8 => u32::from(game.solved(run)),
            9 => run.events.len() as u32,
            _ => u32::MAX,
        }
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn node(index: u32, field: u32) -> u32 {
    STATE.with(|s| {
        let s = s.borrow();
        let Some(n) = s.0.graph.nodes.get(index as usize) else {
            return u32::MAX;
        };
        match field {
            0 => n.cost.unwrap_or(u32::MAX),
            1 => n.x,
            2 => n.y,
            3 => u32::from(s.0.level.graph.nodes[index as usize].cost.is_some()),
            _ => u32::MAX,
        }
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn event(index: u32, field: u32) -> u32 {
    STATE.with(|s| {
        let s = s.borrow();
        let Some(e) = s.1.events.get(index as usize) else {
            return u32::MAX;
        };
        match field {
            0 => e.kind as u32,
            1 => e.node as u32,
            2 => e.cost,
            3 => e.predecessor as u32,
            _ => u32::MAX,
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn minimum_cost_and_weight_change() {
        let mut game = Game::new(Level::weighted(0x7f93a2));
        let before = game.run();
        assert_eq!(before.cost, Some(10));
        assert!(!before.path.contains(&24));
        assert!(game.change(24, false));
        let after = game.run();
        assert_eq!(after.cost, Some(8));
        assert!(game.solved(&after));
        assert!(game.undo());
        assert_eq!(game.run(), before);
    }
    #[test]
    fn obstacles_and_unreachable() {
        let mut game = Game::new(Level::weighted(0));
        let before = game.run();
        assert!(game.change(10, true));
        let after = game.run();
        assert!(!after.path.contains(&10));
        assert_ne!(after.path, before.path);
        assert!(game.change(24, true));
        let run = game.run();
        assert!(run.path.is_empty());
        assert_eq!(run.cost, None);
        assert_eq!(run.events.last().unwrap().kind, Kind::Unreachable);
    }
    #[test]
    fn seeded_levels_and_validated_puzzles() {
        for seed in 0..100 {
            assert_eq!(Level::weighted(seed), Level::weighted(seed));
            let mut game = Game::new(Level::weighted(seed));
            assert!(!game.solved(&game.run()));
            game.change(24, false);
            assert!(game.solved(&game.run()));
        }
        assert_ne!(Level::weighted(0), Level::weighted(1));
    }
    #[test]
    fn event_consistency_and_astar_optimality() {
        for seed in 0..20 {
            let graph = Level::weighted(seed).graph;
            let d = search(&graph, Algorithm::Dijkstra);
            let a = search(&graph, Algorithm::AStar);
            assert_eq!(d.cost, a.cost);
            for run in [d, a] {
                let visited: Vec<_> = run
                    .events
                    .iter()
                    .filter(|e| e.kind == Kind::Visited)
                    .map(|e| e.node)
                    .collect();
                assert_eq!(visited.len(), run.explored);
                let mut unique = visited.clone();
                unique.sort();
                unique.dedup();
                assert_eq!(visited.len(), unique.len());
                assert_eq!(run.path.first(), Some(&graph.start));
                assert_eq!(run.path.last(), Some(&graph.target));
                let cost: u32 = run
                    .path
                    .iter()
                    .skip(1)
                    .map(|&i| graph.nodes[i].cost.unwrap())
                    .sum();
                assert_eq!(Some(cost), run.cost);
                for pair in run.path.windows(2) {
                    assert!(graph.nodes[pair[0]].neighbors.contains(&pair[1]));
                }
                for e in run.events.iter().filter(|e| e.kind == Kind::CostUpdated) {
                    assert!(graph.nodes[e.predecessor].neighbors.contains(&e.node));
                }
            }
        }
    }
    #[test]
    fn homepage_uses_real_engine_and_budget_is_enforced() {
        let mut game = Game::new(Level::homepage());
        assert_eq!(game.run().cost, Some(5));
        assert!(!game.change(0, false));
        assert!(game.change(3, false));
        assert_eq!(game.run().cost, Some(3));
        assert!(game.solved(&game.run()));
        assert!(!game.change(2, false));
        game.reset();
        assert_eq!(game.used(), 0);
        assert!(!game.solved(&game.run()));
    }
    #[test]
    fn malformed_graph_and_blocked_endpoints_do_not_panic() {
        let mut graph = Level::homepage().graph;
        graph.nodes[0].cost = None;
        assert_eq!(search(&graph, Algorithm::AStar).cost, None);
        graph.start = 99;
        assert_eq!(search(&graph, Algorithm::Dijkstra).cost, None);
    }
}
