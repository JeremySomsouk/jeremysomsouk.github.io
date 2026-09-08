use std::cell::RefCell;

#[derive(Default)]
struct Game {
    cards: Vec<u32>,
    matched: Vec<bool>,
    first: Option<usize>,
    second: Option<usize>,
}

impl Game {
    fn new(pairs: u32, seed: u32) -> Self {
        let mut rng = seed.max(1);
        let mut shuffle = |items: &mut [u32]| {
            for i in (1..items.len()).rev() {
                rng ^= rng << 13;
                rng ^= rng >> 17;
                rng ^= rng << 5;
                items.swap(i, rng as usize % (i + 1));
            }
        };
        let mut symbols: Vec<u32> = (0..8).collect();
        shuffle(&mut symbols);
        let mut cards: Vec<u32> = symbols[..pairs.clamp(3, 5) as usize]
            .iter()
            .flat_map(|&symbol| [symbol, symbol])
            .collect();
        shuffle(&mut cards);
        Self {
            matched: vec![false; cards.len()],
            cards,
            first: None,
            second: None,
        }
    }

    fn flip(&mut self, index: usize) -> u32 {
        if index >= self.cards.len()
            || self.second.is_some()
            || self.matched[index]
            || self.first == Some(index)
        {
            return 0;
        }
        let Some(first) = self.first else {
            self.first = Some(index);
            return 1;
        };
        if self.cards[first] == self.cards[index] {
            self.matched[first] = true;
            self.matched[index] = true;
            self.first = None;
            if self.matched.iter().all(|&value| value) {
                4
            } else {
                3
            }
        } else {
            self.second = Some(index);
            2
        }
    }
}

thread_local! {
    static GAME: RefCell<Game> = RefCell::new(Game::default());
}

#[unsafe(no_mangle)]
pub extern "C" fn start(pairs: u32, seed: u32) {
    GAME.with(|game| *game.borrow_mut() = Game::new(pairs, seed));
}

#[unsafe(no_mangle)]
pub extern "C" fn flip(index: u32) -> u32 {
    GAME.with(|game| game.borrow_mut().flip(index as usize))
}

#[unsafe(no_mangle)]
pub extern "C" fn hide_mismatch() {
    GAME.with(|game| {
        let mut game = game.borrow_mut();
        if game.second.take().is_some() {
            game.first = None;
        }
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn card(index: u32) -> u32 {
    GAME.with(|game| {
        let game = game.borrow();
        let i = index as usize;
        if i < game.cards.len()
            && (game.matched[i] || game.first == Some(i) || game.second == Some(i))
        {
            game.cards[i] + 1
        } else {
            0
        }
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn is_matched(index: u32) -> u32 {
    GAME.with(|game| {
        u32::from(
            game.borrow()
                .matched
                .get(index as usize)
                .copied()
                .unwrap_or(false),
        )
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decks_contain_pairs_and_vary_with_seed() {
        for pairs in 3..=5 {
            for seed in 0..100 {
                let game = Game::new(pairs, seed);
                assert_eq!(game.cards.len(), pairs as usize * 2);
                for &symbol in &game.cards {
                    assert_eq!(
                        game.cards.iter().filter(|&&value| value == symbol).count(),
                        2
                    );
                }
            }
        }
        assert_ne!(Game::new(3, 1).cards, Game::new(3, 2).cards);
    }

    #[test]
    fn rejects_duplicate_and_locked_flips() {
        start(3, 42);
        assert_eq!(card(0), 0);
        assert_eq!(flip(99), 0);
        assert_eq!(flip(0), 1);
        assert_ne!(card(0), 0);
        assert_eq!(flip(0), 0);
        let other = GAME.with(|g| {
            g.borrow()
                .cards
                .iter()
                .position(|&v| v != g.borrow().cards[0])
                .unwrap()
        });
        assert_eq!(flip(other as u32), 2);
        assert_eq!(flip(1), 0);
        hide_mismatch();
        assert_eq!(card(0), 0);
        assert_eq!(card(other as u32), 0);
        assert_eq!(flip(0), 1);
    }

    #[test]
    fn completes_and_resets() {
        start(5, 20);
        let cards = GAME.with(|g| g.borrow().cards.clone());
        let mut count = 0;
        for i in 0..cards.len() {
            if is_matched(i as u32) != 0 {
                continue;
            }
            let j = (i + 1..cards.len())
                .find(|&j| cards[j] == cards[i])
                .unwrap();
            assert_eq!(flip(i as u32), 1);
            count += 1;
            assert_eq!(flip(j as u32), if count == 5 { 4 } else { 3 });
            assert_eq!(flip(i as u32), 0);
        }
        start(3, 21);
        assert_eq!(card(0), 0);
        assert_eq!(is_matched(0), 0);
        assert_eq!(flip(0), 1);
    }
}
