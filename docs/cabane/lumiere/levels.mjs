// Add a data entry to extend the game; the engine and UI do not depend on level IDs.
export const levels = [
  {
    id: 'level-001', title: 'Un petit réveil', width: 4, height: 4,
    lights: [{ id: 'lamp', x: 0, y: 3, direction: 'E' }],
    ghosts: [{ id: 'g1', x: 2, y: 0 }], walls: [], availablePieces: 1,
    hint: { x: 2, y: 3 },
  },
  {
    id: 'level-002', title: 'Deux amis', width: 4, height: 4,
    lights: [{ id: 'lamp', x: 0, y: 3, direction: 'E' }],
    ghosts: [{ id: 'g1', x: 2, y: 2 }, { id: 'g2', x: 2, y: 0 }],
    walls: [], availablePieces: 1,
  },
  {
    id: 'level-003', title: 'Un mur à contourner', width: 4, height: 4,
    lights: [{ id: 'lamp', x: 0, y: 3, direction: 'E' }],
    ghosts: [{ id: 'g1', x: 3, y: 1 }],
    walls: [{ x: 2, y: 3 }, { x: 2, y: 2 }], availablePieces: 2,
  },
  {
    id: 'level-004', title: 'De reflet en reflet', width: 4, height: 4,
    lights: [{ id: 'lamp', x: 0, y: 3, direction: 'E' }],
    ghosts: [{ id: 'g1', x: 2, y: 1 }, { id: 'g2', x: 3, y: 0 }],
    walls: [{ x: 2, y: 3 }, { x: 2, y: 2 }], availablePieces: 3,
  },
  {
    id: 'level-005', title: 'Toute la maison s’éveille', width: 5, height: 5,
    lights: [{ id: 'lamp', x: 0, y: 4, direction: 'E' }],
    ghosts: [{ id: 'g1', x: 1, y: 3 }, { id: 'g2', x: 2, y: 1 }, { id: 'g3', x: 3, y: 4 }],
    walls: [{ x: 2, y: 4 }, { x: 1, y: 0 }, { x: 4, y: 1 }, { x: 2, y: 2 }],
    availablePieces: 3,
  },
  {
    id: 'level-006', title: 'Un rayon devient deux', tier: 2, width: 5, height: 5,
    lights: [{ id: 'lamp', x: 0, y: 4, direction: 'E' }],
    ghosts: [{ id: 'g1', x: 2, y: 0 }, { id: 'g2', x: 4, y: 4 }],
    walls: [], availablePieces: 0, availablePrisms: 1, hint: { x: 2, y: 4 }, hintType: 'prism',
  },
  {
    id: 'level-007', title: 'Chacun son chemin', tier: 2, width: 5, height: 5,
    lights: [{ id: 'lamp', x: 0, y: 4, direction: 'E' }],
    ghosts: [{ id: 'g1', x: 1, y: 1 }, { id: 'g2', x: 2, y: 2 }, { id: 'g3', x: 2, y: 0 }],
    walls: [{ x: 3, y: 4 }, { x: 1, y: 0 }], availablePieces: 1, availablePrisms: 1,
  },
  {
    id: 'level-008', title: 'Le grand détour', tier: 2, width: 5, height: 5,
    lights: [{ id: 'lamp', x: 0, y: 4, direction: 'E' }],
    ghosts: [{ id: 'g1', x: 2, y: 2 }, { id: 'g2', x: 3, y: 1 }, { id: 'g3', x: 4, y: 2 }],
    walls: [{ x: 1, y: 2 }, { x: 3, y: 3 }, { x: 2, y: 0 }], availablePieces: 2, availablePrisms: 1,
  },
  {
    id: 'level-009', title: 'La cascade de lumière', tier: 2, width: 5, height: 5,
    lights: [{ id: 'lamp', x: 0, y: 4, direction: 'E' }],
    ghosts: [{ id: 'g1', x: 1, y: 2 }, { id: 'g2', x: 1, y: 0 }, { id: 'g3', x: 3, y: 1 }, { id: 'g4', x: 4, y: 4 }],
    walls: [{ x: 2, y: 2 }, { x: 3, y: 3 }], availablePieces: 0, availablePrisms: 2,
  },
  {
    id: 'level-010', title: 'La fête des fantômes', tier: 2, width: 5, height: 5,
    lights: [{ id: 'lamp', x: 0, y: 4, direction: 'E' }],
    ghosts: [{ id: 'g1', x: 1, y: 3 }, { id: 'g2', x: 2, y: 1 }, { id: 'g3', x: 3, y: 3 }, { id: 'g4', x: 4, y: 3 }, { id: 'g5', x: 4, y: 1 }],
    walls: [{ x: 2, y: 2 }, { x: 0, y: 2 }, { x: 3, y: 0 }], availablePieces: 2, availablePrisms: 2,
  },
  {
    "id": "level-011",
    "title": "Le passage secret",
    "tier": 3,
    "width": 6,
    "height": 6,
    "lights": [
        {
            "id": "lamp",
            "x": 0,
            "y": 5,
            "direction": "E"
        }
    ],
    "ghosts": [
        {
            "id": "g0",
            "x": 1,
            "y": 3
        },
        {
            "id": "g1",
            "x": 3,
            "y": 1
        },
        {
            "id": "g2",
            "x": 4,
            "y": 2
        },
        {
            "id": "g3",
            "x": 5,
            "y": 4
        }
    ],
    "walls": [
        {
            "x": 2,
            "y": 5
        },
        {
            "x": 2,
            "y": 3
        },
        {
            "x": 3,
            "y": 4
        }
    ],
    "availablePieces": 4,
    "availablePrisms": 0
},
  {
    "id": "level-012",
    "title": "Les deux ailes",
    "tier": 3,
    "width": 6,
    "height": 6,
    "lights": [
        {
            "id": "lamp",
            "x": 0,
            "y": 5,
            "direction": "E"
        }
    ],
    "ghosts": [
        {
            "id": "g0",
            "x": 1,
            "y": 3
        },
        {
            "id": "g1",
            "x": 3,
            "y": 1
        },
        {
            "id": "g2",
            "x": 4,
            "y": 2
        },
        {
            "id": "g3",
            "x": 5,
            "y": 3
        },
        {
            "id": "g4",
            "x": 5,
            "y": 5
        }
    ],
    "walls": [
        {
            "x": 2,
            "y": 3
        },
        {
            "x": 3,
            "y": 4
        },
        {
            "x": 4,
            "y": 0
        }
    ],
    "availablePieces": 3,
    "availablePrisms": 1
},
  {
    "id": "level-013",
    "title": "Le grenier aux étoiles",
    "tier": 3,
    "width": 6,
    "height": 6,
    "lights": [
        {
            "id": "lamp",
            "x": 0,
            "y": 5,
            "direction": "E"
        }
    ],
    "ghosts": [
        {
            "id": "g0",
            "x": 1,
            "y": 0
        },
        {
            "id": "g1",
            "x": 2,
            "y": 2
        },
        {
            "id": "g2",
            "x": 4,
            "y": 3
        },
        {
            "id": "g3",
            "x": 5,
            "y": 4
        },
        {
            "id": "g4",
            "x": 5,
            "y": 5
        }
    ],
    "walls": [
        {
            "x": 2,
            "y": 4
        },
        {
            "x": 3,
            "y": 0
        },
        {
            "x": 5,
            "y": 2
        }
    ],
    "availablePieces": 2,
    "availablePrisms": 2
},
  {
    "id": "level-014",
    "title": "Les rayons voyageurs",
    "tier": 3,
    "width": 6,
    "height": 6,
    "lights": [
        {
            "id": "lamp",
            "x": 0,
            "y": 5,
            "direction": "E"
        }
    ],
    "ghosts": [
        {
            "id": "g0",
            "x": 1,
            "y": 2
        },
        {
            "id": "g1",
            "x": 4,
            "y": 1
        },
        {
            "id": "g2",
            "x": 3,
            "y": 2
        },
        {
            "id": "g3",
            "x": 2,
            "y": 3
        },
        {
            "id": "g4",
            "x": 0,
            "y": 4
        },
        {
            "id": "g5",
            "x": 5,
            "y": 5
        }
    ],
    "walls": [
        {
            "x": 2,
            "y": 4
        },
        {
            "x": 4,
            "y": 3
        },
        {
            "x": 3,
            "y": 0
        }
    ],
    "availablePieces": 3,
    "availablePrisms": 2
},
  {
    "id": "level-015",
    "title": "Le bal de minuit",
    "tier": 3,
    "width": 6,
    "height": 6,
    "lights": [
        {
            "id": "lamp",
            "x": 0,
            "y": 5,
            "direction": "E"
        }
    ],
    "ghosts": [
        {
            "id": "g0",
            "x": 1,
            "y": 0
        },
        {
            "id": "g1",
            "x": 2,
            "y": 1
        },
        {
            "id": "g2",
            "x": 4,
            "y": 1
        },
        {
            "id": "g3",
            "x": 3,
            "y": 2
        },
        {
            "id": "g4",
            "x": 2,
            "y": 3
        },
        {
            "id": "g5",
            "x": 0,
            "y": 4
        },
        {
            "id": "g6",
            "x": 5,
            "y": 2
        }
    ],
    "walls": [
        {
            "x": 2,
            "y": 4
        },
        {
            "x": 4,
            "y": 3
        },
        {
            "x": 3,
            "y": 0
        }
    ],
    "availablePieces": 3,
    "availablePrisms": 3
},
];
