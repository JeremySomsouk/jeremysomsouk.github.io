//! Deterministic relationships, never an overall option score or recommendation.
use serde::{Deserialize, Serialize};
use std::cell::RefCell;

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    #[default]
    En,
    Fr,
}
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ComparisonAnswer {
    Left,
    Right,
    Equal,
    Unknown,
}
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Comparison {
    pub criterion: Option<usize>,
    pub left: usize,
    pub right: usize,
    pub answer: ComparisonAnswer,
}
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Session {
    pub version: u8,
    pub question: String,
    pub criteria: Vec<String>,
    pub options: Vec<String>,
    pub comparisons: Vec<Comparison>,
    pub stage: u8,
    pub note: String,
}
impl Default for Session {
    fn default() -> Self {
        Self {
            version: 1,
            question: String::new(),
            criteria: vec![],
            options: vec![],
            comparisons: vec![],
            stage: 0,
            note: String::new(),
        }
    }
}
#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct Pair {
    pub criterion: Option<usize>,
    pub left: usize,
    pub right: usize,
}
#[derive(Debug, Serialize)]
pub struct Affinity {
    pub criterion: usize,
    pub protected: Vec<usize>,
    pub equal: Vec<[usize; 2]>,
    pub uncertain: Vec<[usize; 2]>,
    pub unexamined: Vec<[usize; 2]>,
    pub contradictory: bool,
}
#[derive(Debug, Serialize)]
pub struct Reflection {
    pub priorities: Vec<usize>,
    pub unexamined_priorities: usize,
    pub uncertainty: usize,
    pub contradictory: bool,
    pub affinities: Vec<Affinity>,
}
#[derive(Serialize)]
pub struct Analysis {
    pub priority: Option<Pair>,
    pub tradeoff: Option<Pair>,
    pub reflection: Reflection,
}

impl Session {
    pub fn valid(&self) -> bool {
        self.version == 1
            && self.stage <= 5
            && self.question.chars().count() <= 2000
            && self.note.chars().count() <= 4000
            && self.criteria.len() <= 7
            && self.options.len() <= 4
            && self
                .criteria
                .iter()
                .chain(&self.options)
                .all(|s| !s.trim().is_empty() && s.chars().count() <= 80)
            && self
                .criteria
                .iter()
                .enumerate()
                .all(|(i, s)| !self.criteria[..i].contains(s))
            && self
                .options
                .iter()
                .enumerate()
                .all(|(i, s)| !self.options[..i].contains(s))
            && self.comparisons.len() <= 50
            && self.comparisons.iter().enumerate().all(|(i, c)| {
                let n = if let Some(k) = c.criterion {
                    if k >= self.criteria.len() {
                        return false;
                    }
                    self.options.len()
                } else {
                    self.criteria.len()
                };
                c.left < n
                    && c.right < n
                    && c.left != c.right
                    && !self.comparisons[..i].iter().any(|p| {
                        p.criterion == c.criterion
                            && ((p.left == c.left && p.right == c.right)
                                || (p.left == c.right && p.right == c.left))
                    })
            })
    }
    fn comparisons(&self, criterion: Option<usize>) -> Vec<&Comparison> {
        self.comparisons
            .iter()
            .filter(|c| c.criterion == criterion)
            .collect()
    }
    pub fn next_priority(&self) -> Option<Pair> {
        let n = self.criteria.len();
        let cs = self.comparisons(None);
        if n < 2 || cs.len() >= (n + 1).min(n * (n - 1) / 2) {
            return None;
        }
        // Cover every priority, then compare expressed tendencies against each other.
        let (_, protected, _) = relations(n, &cs);
        (0..n)
            .flat_map(|a| (a + 1..n).map(move |b| (a, b)))
            .filter(|(a, b)| {
                !cs.iter()
                    .any(|c| (c.left == *a && c.right == *b) || (c.left == *b && c.right == *a))
            })
            .min_by_key(|(a, b)| {
                let count = |i| cs.iter().filter(|c| c.left == i || c.right == i).count();
                (
                    count(*a).max(count(*b)),
                    count(*a) + count(*b),
                    !(protected[*a] && protected[*b]),
                    *a,
                    *b,
                )
            })
            .map(|(left, right)| Pair {
                criterion: None,
                left,
                right,
            })
    }
    pub fn next_tradeoff(&self) -> Option<Pair> {
        if self.options.len() < 2 {
            return None;
        }
        // A short adaptive spanning sequence per criterion, rather than every pair.
        for k in 0..self.criteria.len() {
            let cs = self.comparisons(Some(k));
            if cs.len() >= self.options.len() - 1 {
                continue;
            }
            let right = cs.len() + 1;
            let left = cs.last().map_or(0, |c| {
                if c.answer == ComparisonAnswer::Left {
                    c.left
                } else {
                    c.right
                }
            });
            return Some(Pair {
                criterion: Some(k),
                left,
                right,
            });
        }
        None
    }
    pub fn reflection(&self) -> Reflection {
        let cs = self.comparisons(None);
        let (incoming, outgoing, contradictory) = relations(self.criteria.len(), &cs);
        // Only directly expressed tendencies; an untouched criterion is never called strongest.
        let priorities = (0..self.criteria.len())
            .filter(|&i| outgoing[i] && !incoming[i])
            .collect();
        let unexamined_priorities =
            self.criteria.len() * (self.criteria.len().saturating_sub(1)) / 2 - cs.len();
        let affinities = (0..self.criteria.len())
            .map(|k| {
                let cs = self.comparisons(Some(k));
                let (incoming, outgoing, contradictory) = relations(self.options.len(), &cs);
                Affinity {
                    criterion: k,
                    protected: (0..self.options.len())
                        .filter(|&i| outgoing[i] && !incoming[i])
                        .collect(),
                    equal: cs
                        .iter()
                        .filter(|c| c.answer == ComparisonAnswer::Equal)
                        .map(|c| [c.left, c.right])
                        .collect(),
                    uncertain: cs
                        .iter()
                        .filter(|c| c.answer == ComparisonAnswer::Unknown)
                        .map(|c| [c.left, c.right])
                        .collect(),
                    unexamined: (0..self.options.len())
                        .flat_map(|a| (a + 1..self.options.len()).map(move |b| [a, b]))
                        .filter(|[a, b]| {
                            !cs.iter().any(|c| {
                                (c.left == *a && c.right == *b) || (c.left == *b && c.right == *a)
                            })
                        })
                        .collect(),
                    contradictory,
                }
            })
            .collect();
        Reflection {
            priorities,
            unexamined_priorities,
            uncertainty: self
                .comparisons
                .iter()
                .filter(|c| c.answer == ComparisonAnswer::Unknown)
                .count(),
            contradictory,
            affinities,
        }
    }
    pub fn reset(&mut self) {
        *self = Self::default();
    }
    pub fn analyze(&self) -> Analysis {
        Analysis {
            priority: self.next_priority(),
            tradeoff: self.next_tradeoff(),
            reflection: self.reflection(),
        }
    }
}
fn relations(n: usize, cs: &[&Comparison]) -> (Vec<bool>, Vec<bool>, bool) {
    let mut reach = vec![vec![false; n]; n];
    let mut equivalent = vec![vec![false; n]; n];
    let mut incoming = vec![false; n];
    let mut outgoing = vec![false; n];
    for (i, row) in equivalent.iter_mut().enumerate() {
        row[i] = true;
    }
    for c in cs {
        if c.answer == ComparisonAnswer::Equal {
            equivalent[c.left][c.right] = true;
            equivalent[c.right][c.left] = true;
        }
    }
    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                equivalent[i][j] |= equivalent[i][k] && equivalent[k][j];
            }
        }
    }
    for c in cs {
        let edge = match c.answer {
            ComparisonAnswer::Left => Some((c.left, c.right)),
            ComparisonAnswer::Right => Some((c.right, c.left)),
            _ => None,
        };
        if let Some((a, b)) = edge {
            outgoing[a] = true;
            incoming[b] = true;
            for i in 0..n {
                for j in 0..n {
                    if equivalent[i][a] && equivalent[b][j] {
                        reach[i][j] = true;
                    }
                }
            }
        }
    }
    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                reach[i][j] |= reach[i][k] && reach[k][j];
            }
        }
    }
    let cycle = (0..n).any(|i| reach[i][i]);
    if cycle {
        outgoing.fill(false);
    }
    (incoming, outgoing, cycle)
}

// Small JSON ABI: the browser owns I/O; Rust owns all comparison derivation.
thread_local! { static INPUT: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) }; static OUTPUT: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) }; }
#[unsafe(no_mangle)]
pub extern "C" fn input(len: u32) -> *mut u8 {
    INPUT.with(|b| {
        let mut b = b.borrow_mut();
        b.fill(0);
        b.resize((len as usize).min(65536), 0);
        b.as_mut_ptr()
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn analyze() -> u32 {
    INPUT.with(|b| {
        let result = serde_json::from_slice::<Session>(&b.borrow())
            .ok()
            .filter(Session::valid)
            .and_then(|s| serde_json::to_vec(&s.analyze()).ok());
        OUTPUT.with(|out| {
            *out.borrow_mut() = result.unwrap_or_default();
            out.borrow().len() as u32
        })
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn output() -> *const u8 {
    OUTPUT.with(|b| b.borrow().as_ptr())
}

/// Erase the browser boundary's in-memory writing as well as resetting storage.
#[unsafe(no_mangle)]
pub extern "C" fn clear() {
    INPUT.with(|b| {
        let mut b = b.borrow_mut();
        b.fill(0);
        b.clear();
    });
    OUTPUT.with(|b| {
        let mut b = b.borrow_mut();
        b.fill(0);
        b.clear();
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    fn session() -> Session {
        Session {
            criteria: vec!["Time".into(), "Family".into(), "Freedom".into()],
            options: vec!["Stay".into(), "Move".into(), "Wait".into()],
            ..Session::default()
        }
    }
    fn c(k: Option<usize>, a: usize, b: usize, answer: ComparisonAnswer) -> Comparison {
        Comparison {
            criterion: k,
            left: a,
            right: b,
            answer,
        }
    }
    #[test]
    fn equality_and_uncertainty_are_not_preferences() {
        let mut s = session();
        s.comparisons = vec![
            c(None, 0, 1, ComparisonAnswer::Equal),
            c(Some(0), 0, 1, ComparisonAnswer::Unknown),
        ];
        let r = s.reflection();
        assert!(r.priorities.is_empty());
        assert_eq!(r.uncertainty, 1);
        assert!(r.affinities[0].protected.is_empty());
        assert_eq!(r.affinities[0].uncertain, vec![[0, 1]]);
        assert_eq!(r.affinities[1].unexamined.len(), 3);
    }
    #[test]
    fn contradictory_equalities_are_visible() {
        let mut s = session();
        s.comparisons = vec![
            c(None, 0, 1, ComparisonAnswer::Equal),
            c(None, 0, 2, ComparisonAnswer::Left),
            c(None, 1, 2, ComparisonAnswer::Right),
        ];
        assert!(s.reflection().contradictory);
        assert!(s.reflection().priorities.is_empty());
    }
    #[test]
    fn incomplete_sessions_have_no_invented_conclusions() {
        let s = Session::default();
        assert!(s.valid());
        assert!(s.reflection().priorities.is_empty());
        assert!(s.next_priority().is_none());
        assert!(s.next_tradeoff().is_none());
    }
    #[test]
    fn detects_cycles_without_recommending_an_option() {
        let mut s = session();
        s.comparisons = vec![
            c(None, 0, 1, ComparisonAnswer::Left),
            c(None, 1, 2, ComparisonAnswer::Left),
            c(None, 0, 2, ComparisonAnswer::Right),
            c(Some(0), 0, 1, ComparisonAnswer::Right),
        ];
        let r = s.reflection();
        assert!(r.contradictory);
        assert!(r.priorities.is_empty());
        assert_eq!(r.affinities[0].protected, vec![1]);
        let json = serde_json::to_string(&r).unwrap();
        assert!(!json.contains("winner"));
    }
    #[test]
    fn bounded_comparisons_cover_every_criterion_and_option() {
        let mut s = session();
        s.criteria.extend([
            "Learning".into(),
            "Energy".into(),
            "Money".into(),
            "Stability".into(),
        ]);
        s.options.push("Else".into());
        while let Some(p) = s.next_priority() {
            s.comparisons
                .push(c(p.criterion, p.left, p.right, ComparisonAnswer::Unknown));
        }
        assert_eq!(s.comparisons.len(), 8);
        for i in 0..7 {
            assert!(s.comparisons.iter().any(|c| c.left == i || c.right == i));
        }
        while let Some(p) = s.next_tradeoff() {
            s.comparisons
                .push(c(p.criterion, p.left, p.right, ComparisonAnswer::Left));
        }
        assert_eq!(s.comparisons.len(), 29);
        assert!(s.valid());
        for a in s.reflection().affinities {
            assert_eq!(a.unexamined.len(), 3);
        }
    }
    #[test]
    fn priority_questions_adapt_to_expressed_tendencies() {
        let mut s = session();
        s.criteria.push("Energy".into());
        s.comparisons = vec![
            c(None, 0, 1, ComparisonAnswer::Right),
            c(None, 2, 3, ComparisonAnswer::Right),
        ];
        assert_eq!(
            s.next_priority(),
            Some(Pair {
                criterion: None,
                left: 1,
                right: 3
            })
        );
    }
    #[test]
    fn adaptive_tradeoff_follows_expressed_preference() {
        let mut s = session();
        s.comparisons
            .push(c(Some(0), 0, 1, ComparisonAnswer::Right));
        assert_eq!(
            s.next_tradeoff(),
            Some(Pair {
                criterion: Some(0),
                left: 1,
                right: 2
            })
        );
    }
    #[test]
    fn serialization_validation_and_reset() {
        let mut s = session();
        s.question = "<script> private & français".into();
        assert_eq!(
            serde_json::from_str::<Session>(&serde_json::to_string(&s).unwrap()).unwrap(),
            s
        );
        s.reset();
        assert_eq!(s, Session::default());
        s.version = 2;
        assert!(!s.valid());
        s = session();
        s.comparisons.push(c(None, 9, 0, ComparisonAnswer::Left));
        assert!(!s.valid());
        s = session();
        s.comparisons = vec![
            c(None, 0, 1, ComparisonAnswer::Left),
            c(None, 1, 0, ComparisonAnswer::Right),
        ];
        assert!(!s.valid());
    }
    #[test]
    fn languages_serialize_without_translating_the_brand() {
        assert_eq!(serde_json::to_string(&Language::En).unwrap(), "\"en\"");
        assert_eq!(serde_json::to_string(&Language::Fr).unwrap(), "\"fr\"");
    }
}
