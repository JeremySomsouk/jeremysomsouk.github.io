const path = (points, width = 66) => ({ points, width });
const pond = (x, y, color = 'cream', r = 34) => ({ x, y, r, color });
const exposed = (source, end) => [[source, end, 31]];

// Portrait landscapes, short routes, generous digging widths. One new idea at a time.
export const levels = [
  {
    id: 'premiere-goutte', title: 'La première goutte', hint: 'Gratte la terre pour libérer l’eau.',
    source: [210, 110], paths: [path([[210, 110], [195, 225], [230, 345], [210, 460]], 76)],
    ponds: [pond(210, 460)], rocks: [],
    exposed: [...exposed([210, 110], [199, 205]), [[222, 320], [210, 460], 39]],
    guide: [[199, 210], [207, 260], [224, 312]],
  },
  {
    id: 'petit-meandre', title: 'Le petit méandre', hint: 'Suis la terre du bout du doigt.',
    source: [145, 100], paths: [path([[145, 100], [155, 190], [275, 280], [260, 380], [175, 490]])],
    ponds: [pond(175, 490, 'rose')], rocks: [], exposed: exposed([145, 100], [149, 150]),
  },
  {
    id: 'autour-du-rocher', title: 'Autour du rocher', hint: 'L’eau peut passer autour du rocher.',
    source: [210, 95], paths: [path([[210, 95], [210, 280], [210, 490]], 122)],
    ponds: [pond(210, 490)], rocks: [{ x: 210, y: 283, r: 28 }], exposed: exposed([210, 95], [210, 148]),
  },
  {
    id: 'deux-petits-jardins', title: 'Deux petits jardins', hint: 'Un peu d’eau pour chaque mare.',
    source: [210, 100], paths: [path([[210, 100], [210, 225], [180, 300], [110, 460]]), path([[210, 240], [285, 335], [310, 460]])],
    ponds: [pond(110, 460), pond(310, 460, 'rose')], rocks: [], exposed: exposed([210, 100], [210, 155]),
  },
  {
    id: 'mare-aux-nenuphars', title: 'La mare aux nénuphars', hint: 'La rivière continue après la mare.',
    source: [130, 95], paths: [path([[130, 95], [110, 190], [210, 295], [300, 400], [260, 505]])],
    ponds: [pond(210, 295), pond(260, 505, 'rose')], rocks: [], exposed: exposed([130, 95], [117, 145]),
  },
  {
    id: 'ile-aux-fleurs', title: 'L’île aux fleurs', hint: 'Choisis ton passage autour de l’île.',
    source: [210, 95], paths: [path([[210, 95], [150, 210], [115, 310], [155, 410], [210, 485]]), path([[210, 130], [285, 225], [300, 330], [265, 420], [210, 485]])],
    ponds: [pond(210, 485, 'rose', 40)], rocks: [{ x: 207, y: 300, r: 31 }], exposed: exposed([210, 95], [186, 143]),
  },
  {
    id: 'trois-mares', title: 'Les trois mares', hint: 'Fais fleurir les trois petites mares.',
    source: [210, 90], paths: [path([[210, 90], [205, 210], [110, 315], [90, 455]]), path([[205, 210], [270, 290], [330, 410]]), path([[195, 220], [210, 380], [210, 520]])],
    ponds: [pond(90, 455), pond(330, 410, 'rose'), pond(210, 520, 'honey')], rocks: [], exposed: exposed([210, 90], [208, 140]),
  },
  {
    id: 'jardin-de-la-riviere', title: 'Le jardin de la rivière', hint: 'À toi de réveiller tout le jardin.',
    source: [120, 85], paths: [path([[120, 85], [130, 170], [225, 245], [285, 320], [310, 435]], 78), path([[225, 245], [155, 335], [105, 460]], 76), path([[160, 330], [190, 425], [225, 525]], 64)],
    ponds: [pond(310, 435), pond(105, 460, 'rose'), pond(225, 525, 'honey')], rocks: [{ x: 223, y: 244, r: 16 }], exposed: exposed([120, 85], [124, 133]),
  },
  {
    id: 'rochers-jumeaux', title: 'Les rochers jumeaux', hint: 'Contourne les deux rochers, puis sépare la rivière.',
    source: [210, 85], paths: [path([[210, 85], [210, 210], [210, 345]], 116), path([[210, 345], [115, 430], [85, 520]]), path([[210, 345], [305, 430], [335, 520]])],
    ponds: [pond(85, 520), pond(335, 520, 'rose')], rocks: [{ x: 200, y: 205, r: 27 }, { x: 224, y: 295, r: 26 }], exposed: exposed([210, 85], [210, 125]),
  },
  {
    id: 'quatre-jardins', title: 'Les quatre jardins', hint: 'Explore chaque branche pour réveiller les quatre mares.',
    source: [210, 80], paths: [path([[210, 80], [210, 210], [210, 350]], 90), path([[210, 210], [115, 250], [75, 330]]), path([[210, 210], [305, 250], [345, 330]]), path([[210, 350], [150, 435], [105, 525]]), path([[210, 350], [270, 435], [315, 525]])],
    ponds: [pond(75, 330), pond(345, 330, 'rose'), pond(105, 525, 'honey'), pond(315, 525)], rocks: [{ x: 210, y: 300, r: 22 }], exposed: exposed([210, 80], [210, 120]),
  },
  {
    id: 'longue-traversee', title: 'La longue traversée', hint: 'La rivière serpente : retrouve les petits chemins vers les mares.',
    source: [85, 80], paths: [path([[85, 80], [150, 150], [325, 165], [330, 270], [110, 300], [95, 405], [290, 440], [330, 525]], 60), path([[230, 160], [240, 85]], 58), path([[110, 300], [75, 235]], 58), path([[180, 420], [155, 525]], 58)],
    ponds: [pond(240, 85, 'rose', 29), pond(75, 235, 'cream', 29), pond(155, 525, 'honey', 29), pond(330, 525, 'rose', 29)], rocks: [{ x: 320, y: 220, r: 14 }, { x: 105, y: 360, r: 14 }], exposed: exposed([85, 80], [109, 109]),
  },
  {
    id: 'grand-verger', title: 'Le grand verger', hint: 'Cinq mares attendent l’eau. N’oublie aucune bifurcation !',
    source: [210, 75], paths: [path([[210, 75], [210, 190], [210, 330], [210, 525]], 100), path([[210, 190], [120, 220], [70, 300]], 60), path([[210, 190], [300, 220], [350, 300]], 60), path([[210, 350], [120, 420], [75, 510]], 60), path([[210, 350], [300, 420], [345, 510]], 60)],
    ponds: [pond(70, 300, 'cream', 29), pond(350, 300, 'rose', 29), pond(75, 510, 'honey', 29), pond(345, 510, 'rose', 29), pond(210, 525, 'cream', 29)], rocks: [{ x: 200, y: 185, r: 22 }, { x: 225, y: 315, r: 22 }, { x: 198, y: 435, r: 22 }], exposed: exposed([210, 75], [210, 115]),
  },
  {
    id: 'premiere-ecluse', title: 'La première écluse', hint: 'Arrose la mare 1 pour ouvrir l’écluse 1, puis rejoins la mare du bas.',
    source: [210, 80], paths: [path([[210, 80], [210, 210], [210, 360], [210, 520]], 70), path([[210, 210], [120, 240], [80, 315]], 64)],
    ponds: [pond(80, 315, 'honey'), pond(210, 520, 'rose')], rocks: [], exposed: exposed([210, 80], [210, 120]),
    gates: [{ x: 210, y: 350, width: 90, height: 25, pond: 0 }],
  },
  {
    id: 'ecluses-en-cascade', title: 'Les écluses en cascade', hint: 'Chaque mare numérotée ouvre l’écluse du même numéro.',
    source: [210, 70], paths: [path([[210, 70], [210, 200], [210, 350], [210, 535]], 66), path([[210, 180], [120, 195], [75, 250]], 60), path([[210, 350], [300, 350], [345, 410]], 60)],
    ponds: [pond(75, 250, 'honey', 30), pond(345, 410, 'rose', 30), pond(210, 535, 'cream', 30)], rocks: [], exposed: exposed([210, 70], [210, 110]),
    gates: [{ x: 210, y: 280, width: 85, height: 25, pond: 0 }, { x: 210, y: 455, width: 85, height: 25, pond: 1 }],
  },
  {
    id: 'jardin-des-ecluses', title: 'Le jardin des écluses', hint: 'Retrouve l’ordre des trois écluses pour faire fleurir tout le jardin.',
    source: [90, 75], paths: [path([[90, 75], [90, 200], [210, 250], [325, 300], [325, 410], [210, 470], [90, 530]], 70), path([[90, 170], [160, 135], [225, 110]], 60), path([[225, 260], [275, 185], [340, 135]], 60), path([[300, 420], [235, 370], [160, 355]], 60)],
    ponds: [pond(225, 110, 'honey', 29), pond(340, 135, 'rose', 29), pond(160, 355, 'cream', 29), pond(90, 530, 'rose', 29)], rocks: [{ x: 327, y: 355, r: 15 }], exposed: exposed([90, 75], [90, 115]),
    gates: [{ x: 145, y: 225, width: 25, height: 110, pond: 0 }, { x: 325, y: 305, width: 110, height: 25, pond: 1 }, { x: 175, y: 487, width: 25, height: 110, pond: 2 }],
  },
];
