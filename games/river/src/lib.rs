use std::cell::RefCell;

pub const LEVELS: [&str; 20] = [
    "SHV\n..P",
    "SHV\n.PP",
    "S..\nH..\nVP.\nVP.",
    "S..S.\nVPHHP",
    "SHHV\nH..P\nVP..",
    "SHHHV\nHP..P\nVP...",
    "S...S\nH...V\nP.#.P",
    "S...S\nH...V\nVP#.P",
    "SHHHHV\nHP...P\nVP..#.",
    "S...S...S\nH...H...H\nVP#PV#.PV",
    "S....S\nHP..PH\nVP..PV\n..##..\n......\n......",
    "S..S..S\nHP.VPPH\nVPPVPPV\n.##....\n.......\n.......",
    "S...S..S\nHP..HPPV\nVP.PVPPV\n..#.....\n........\n........",
    "S..S..S.S\nHP.VP.HPH\nVPPVPPVPV\n.##...#.#\n.........\n.........",
    "S...S..S.S\nHP..HP.VPH\nVP.PVPPVPV\n..#....#.#\n..........\n..........",
    "S..S...S..S\nHP.VP..HPPH\nVPPVP.PVPPV\n.##.....##.\n...........\n...........",
    "S...S...S..S\nHP..HP..VPPH\nVP.PVP.PVPPV\n..#......##.\n............\n............",
    "S..S...S..S.S\nHP.VP..HP.HPV\nVPPVP.PVPPVPV\n.##.....##...\n.............\n.............",
    "S...S...S...S.\nHP..HP..VP..HP\nVP.PVP.PVP.PVP\n..#.......#...\n..............\n..............",
    "S..S...S...S..S\nHP.VP..HP..HPPV\nVPPVP.PVP.PVPPV\n.##......#.....\n...............\n...............",
];

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Orientation {
    Horizontal,
    Vertical,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Tile {
    Ground,
    Spring,
    Rock,
    Channel(Orientation),
    Plant,
}

#[derive(Clone)]
pub struct Game {
    rows: usize,
    cols: usize,
    tiles: Vec<Tile>,
    wet: Vec<bool>,
    watered: Vec<bool>,
    history: Vec<(usize, Tile)>,
}

impl Game {
    pub fn from_ascii(level: &str) -> Result<Self, String> {
        let rows: Vec<&str> = level.split('\n').filter(|row| !row.is_empty()).collect();
        let Some(first) = rows.first() else {
            return Err("a level cannot be empty".to_owned());
        };
        let cols = first.len();
        if rows.iter().any(|row| row.len() != cols) {
            return Err("level rows must have the same width".to_owned());
        }
        let mut tiles = Vec::with_capacity(rows.len() * cols);
        for row in &rows {
            for character in row.chars() {
                tiles.push(match character {
                    '.' => Tile::Ground,
                    'S' => Tile::Spring,
                    '#' => Tile::Rock,
                    'H' => Tile::Channel(Orientation::Horizontal),
                    'V' => Tile::Channel(Orientation::Vertical),
                    'P' => Tile::Plant,
                    _ => return Err(format!("unknown level character: {character}")),
                });
            }
        }
        let mut game = Self {
            rows: rows.len(),
            cols,
            tiles,
            wet: vec![false; rows.len() * cols],
            watered: vec![false; rows.len() * cols],
            history: Vec::new(),
        };
        game.simulate();
        Ok(game)
    }

    pub fn tap(&mut self, row: usize, col: usize) -> bool {
        if self.is_solved() {
            return false;
        }
        let index = match self.index(row, col) {
            Some(index) => index,
            None => return false,
        };
        if let Tile::Channel(orientation) = self.tiles[index] {
            self.history.push((index, self.tiles[index]));
            self.tiles[index] = Tile::Channel(match orientation {
                Orientation::Horizontal => Orientation::Vertical,
                Orientation::Vertical => Orientation::Horizontal,
            });
            self.simulate();
            true
        } else {
            false
        }
    }

    pub fn is_watered(&self, row: usize, col: usize) -> bool {
        self.index(row, col)
            .map(|index| self.watered[index])
            .unwrap_or(false)
    }

    pub fn undo(&mut self) -> bool {
        let Some((index, tile)) = self.history.pop() else {
            return false;
        };
        self.tiles[index] = tile;
        self.simulate();
        true
    }

    pub fn is_solved(&self) -> bool {
        let mut plants = 0;
        let mut watered = 0;
        for (&tile, is_watered) in self.tiles.iter().zip(self.watered.iter()) {
            if tile == Tile::Plant {
                plants += 1;
                watered += usize::from(*is_watered);
            }
        }
        plants > 0 && plants == watered
    }

    pub fn rows(&self) -> u32 {
        self.rows as u32
    }

    pub fn cols(&self) -> u32 {
        self.cols as u32
    }

    pub fn tile_code(&self, row: usize, col: usize) -> u32 {
        match self.index(row, col).map(|index| self.tiles[index]) {
            Some(Tile::Ground) | None => 0,
            Some(Tile::Spring) => 1,
            Some(Tile::Rock) => 2,
            Some(Tile::Channel(Orientation::Horizontal)) => 3,
            Some(Tile::Channel(Orientation::Vertical)) => 4,
            Some(Tile::Plant) => 5,
        }
    }

    pub fn is_wet(&self, row: usize, col: usize) -> bool {
        self.index(row, col)
            .map(|index| {
                self.tiles[index] == Tile::Spring
                    || (matches!(self.tiles[index], Tile::Channel(_)) && self.wet[index])
            })
            .unwrap_or(false)
    }

    fn index(&self, row: usize, col: usize) -> Option<usize> {
        if row < self.rows && col < self.cols {
            Some(row * self.cols + col)
        } else {
            None
        }
    }

    fn position(&self, index: usize) -> (usize, usize) {
        (index / self.cols, index % self.cols)
    }

    fn are_connected(&self, first: usize, second: usize) -> bool {
        let (first_row, first_col) = self.position(first);
        let (second_row, second_col) = self.position(second);
        let horizontal = first_row == second_row && first_col.abs_diff(second_col) == 1;
        let vertical = first_col == second_col && first_row.abs_diff(second_row) == 1;
        match (self.tiles[first], self.tiles[second]) {
            (Tile::Spring, Tile::Channel(orientation))
            | (Tile::Channel(orientation), Tile::Spring) => {
                matches!(
                    (orientation, horizontal, vertical),
                    (Orientation::Horizontal, true, false) | (Orientation::Vertical, false, true)
                )
            }
            (Tile::Channel(Orientation::Horizontal), Tile::Channel(Orientation::Horizontal)) => {
                horizontal
            }
            (Tile::Channel(Orientation::Vertical), Tile::Channel(Orientation::Vertical)) => {
                vertical
            }
            _ => false,
        }
    }

    fn simulate(&mut self) {
        self.wet.fill(false);
        let mut queue = Vec::new();
        for index in 0..self.tiles.len() {
            if self.tiles[index] != Tile::Spring {
                continue;
            }
            for neighbor in self.neighbors(index) {
                if matches!(self.tiles[neighbor], Tile::Channel(_))
                    && self.are_connected(index, neighbor)
                {
                    self.wet[neighbor] = true;
                    queue.push(neighbor);
                }
            }
        }
        while let Some(index) = queue.pop() {
            for neighbor in self.neighbors(index) {
                if !self.wet[neighbor]
                    && matches!(self.tiles[neighbor], Tile::Channel(_))
                    && self.are_connected(index, neighbor)
                {
                    self.wet[neighbor] = true;
                    queue.push(neighbor);
                }
            }
        }
        self.watered.fill(false);
        for index in 0..self.tiles.len() {
            if self.tiles[index] != Tile::Plant {
                continue;
            }
            self.watered[index] = self.neighbors(index).into_iter().any(|neighbor| {
                self.tiles[neighbor] == Tile::Spring
                    || (matches!(self.tiles[neighbor], Tile::Channel(_)) && self.wet[neighbor])
            });
        }
    }

    fn neighbors(&self, index: usize) -> Vec<usize> {
        let (row, col) = self.position(index);
        let mut neighbors = Vec::new();
        if row > 0 {
            neighbors.push(index - self.cols);
        }
        if col > 0 {
            neighbors.push(index - 1);
        }
        if row + 1 < self.rows {
            neighbors.push(index + self.cols);
        }
        if col + 1 < self.cols {
            neighbors.push(index + 1);
        }
        neighbors
    }
}

thread_local! {
    static GAME: RefCell<Option<Game>> = const { RefCell::new(None) };
}

#[unsafe(no_mangle)]
pub extern "C" fn level_count() -> u32 {
    LEVELS.len() as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn start(level: u32) -> u32 {
    let Some(definition) = LEVELS.get(level as usize) else {
        return 0;
    };
    match Game::from_ascii(definition) {
        Ok(game) => {
            GAME.with(|current| *current.borrow_mut() = Some(game));
            1
        }
        Err(_) => 0,
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn rows() -> u32 {
    GAME.with(|game| game.borrow().as_ref().map_or(0, Game::rows))
}

#[unsafe(no_mangle)]
pub extern "C" fn cols() -> u32 {
    GAME.with(|game| game.borrow().as_ref().map_or(0, Game::cols))
}

#[unsafe(no_mangle)]
pub extern "C" fn tile(row: u32, col: u32) -> u32 {
    GAME.with(|game| {
        game.borrow()
            .as_ref()
            .map_or(255, |game| game.tile_code(row as usize, col as usize))
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn is_wet(row: u32, col: u32) -> u32 {
    GAME.with(|game| {
        u32::from(
            game.borrow()
                .as_ref()
                .is_some_and(|game| game.is_wet(row as usize, col as usize)),
        )
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn is_watered(row: u32, col: u32) -> u32 {
    GAME.with(|game| {
        u32::from(
            game.borrow()
                .as_ref()
                .is_some_and(|game| game.is_watered(row as usize, col as usize)),
        )
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn tap(row: u32, col: u32) -> u32 {
    GAME.with(|game| {
        u32::from(
            game.borrow_mut()
                .as_mut()
                .is_some_and(|game| game.tap(row as usize, col as usize)),
        )
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn undo() -> u32 {
    GAME.with(|game| u32::from(game.borrow_mut().as_mut().is_some_and(|game| game.undo())))
}

#[unsafe(no_mangle)]
pub extern "C" fn is_solved() -> u32 {
    GAME.with(|game| u32::from(game.borrow().as_ref().is_some_and(Game::is_solved)))
}

#[unsafe(no_mangle)]
pub extern "C" fn move_count() -> u32 {
    GAME.with(|game| {
        game.borrow()
            .as_ref()
            .map_or(0, |game| game.history.len() as u32)
    })
}

#[cfg(test)]
mod tests {
    #[test]
    fn rotating_a_channel_connects_the_spring_to_the_plant() {
        let mut game = crate::Game::from_ascii("SHV\n..P").unwrap();
        assert!(!game.is_solved());
        assert!(!game.is_watered(1, 2));
        assert!(game.tap(0, 2));
        assert!(game.is_solved());
        assert!(game.is_watered(1, 2));
    }

    #[test]
    fn undo_restores_the_previous_channel_and_water_state() {
        let mut game = crate::Game::from_ascii("SHV\n..P").unwrap();
        assert!(game.tap(0, 2));
        assert!(game.is_solved());
        assert!(game.undo());
        assert!(!game.is_solved());
        assert!(!game.is_watered(1, 2));
        assert!(!game.undo());
        assert!(game.tap(0, 2));
        assert!(game.is_solved());
    }

    fn channel_positions(level: &str) -> Vec<(usize, usize)> {
        level
            .split('\n')
            .enumerate()
            .flat_map(|(row, line)| {
                line.chars()
                    .enumerate()
                    .filter_map(move |(col, character)| {
                        matches!(character, 'H' | 'V').then_some((row, col))
                    })
            })
            .collect()
    }

    #[test]
    fn wasm_api_selects_levels_and_tracks_turn_state() {
        assert_eq!(crate::level_count(), 20);
        assert_eq!(crate::start(0), 1);
        assert_eq!(crate::rows(), 2);
        assert_eq!(crate::cols(), 3);
        assert_eq!(crate::tile(0, 0), 1);
        assert_eq!(crate::tile(0, 1), 3);
        assert_eq!(crate::tile(0, 2), 4);
        assert_eq!(crate::tile(1, 2), 5);
        assert_eq!(crate::is_wet(0, 0), 1);
        assert_eq!(crate::is_wet(0, 2), 0);
        assert_eq!(crate::is_watered(1, 2), 0);
        assert_eq!(crate::tap(0, 2), 1);
        assert_eq!(crate::tile(0, 2), 3);
        assert_eq!(crate::is_wet(0, 2), 1);
        assert_eq!(crate::is_watered(1, 2), 1);
        assert_eq!(crate::is_solved(), 1);
        assert_eq!(crate::move_count(), 1);
        assert_eq!(crate::tap(0, 1), 0);
        assert_eq!(crate::undo(), 1);
        assert_eq!(crate::is_solved(), 0);
        assert_eq!(crate::move_count(), 0);
        assert_eq!(crate::start(20), 0);
    }

    #[test]
    fn every_builtin_level_is_solvable_but_not_initially_solved() {
        assert_eq!(crate::LEVELS.len(), 20);
        assert_eq!(
            crate::LEVELS
                .iter()
                .collect::<std::collections::BTreeSet<_>>()
                .len(),
            20
        );
        for level in crate::LEVELS {
            let game = crate::Game::from_ascii(level).unwrap();
            assert!(!game.is_solved());

            let channels = channel_positions(level);
            let combinations = 1usize << channels.len();
            let mut solvable = false;
            for mask in 0..combinations {
                let mut candidate = crate::Game::from_ascii(level).unwrap();
                for (index, &(row, col)) in channels.iter().enumerate() {
                    if mask & (1 << index) != 0 {
                        assert!(candidate.tap(row, col));
                    }
                }
                if candidate.is_solved() {
                    solvable = true;
                    break;
                }
            }
            assert!(solvable, "no channel combination solves {level}");
        }
    }
}
