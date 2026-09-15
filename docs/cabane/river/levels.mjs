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
];
