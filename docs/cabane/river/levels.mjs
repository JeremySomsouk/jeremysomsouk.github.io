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
  {
    id: 'gorge-des-ecluses', title: 'La gorge des écluses', hint: 'Contourne les rochers pour atteindre les mares qui ouvrent les passages.',
    source: [210, 70], paths: [path([[210, 70], [210, 220], [210, 365], [210, 535]], 100), path([[210, 170], [120, 190], [75, 260]], 60), path([[210, 350], [300, 375], [345, 435]], 60)],
    ponds: [pond(75, 260, 'honey', 30), pond(345, 435, 'rose', 30), pond(210, 535, 'cream', 30)], rocks: [{ x: 205, y: 170, r: 23 }, { x: 220, y: 350, r: 23 }, { x: 200, y: 490, r: 18 }], exposed: exposed([210, 70], [210, 110]),
    gates: [{ x: 210, y: 285, width: 120, height: 25, pond: 0 }, { x: 210, y: 445, width: 120, height: 25, pond: 1 }],
  },
  {
    id: 'sentier-des-saules', title: 'Le sentier des saules', hint: 'Suis les méandres et leurs branches pour ouvrir les trois écluses.',
    source: [330, 70], paths: [path([[330, 70], [330, 195], [220, 255], [95, 300], [95, 420], [210, 480], [330, 535]], 70), path([[330, 160], [260, 130], [190, 100]], 60), path([[205, 260], [140, 200], [75, 150]], 60), path([[105, 415], [185, 365], [260, 350]], 60)],
    ponds: [pond(190, 100, 'honey', 29), pond(75, 150, 'rose', 29), pond(260, 350, 'cream', 29), pond(330, 535, 'rose', 29)], rocks: [{ x: 98, y: 355, r: 15 }, { x: 260, y: 505, r: 12 }], exposed: exposed([330, 70], [330, 110]),
    gates: [{ x: 270, y: 230, width: 25, height: 110, pond: 0 }, { x: 95, y: 310, width: 110, height: 25, pond: 1 }, { x: 175, y: 465, width: 25, height: 110, pond: 2 }],
  },
  {
    id: 'quatre-clefs-du-verger', title: 'Les quatre clefs du verger', hint: 'Quatre mares, quatre écluses : prépare les branches pour réveiller la dernière mare.',
    source: [210, 65], paths: [path([[210, 65], [210, 220], [210, 390], [210, 550]], 80), path([[210, 130], [135, 130], [75, 155]], 58), path([[210, 250], [285, 240], [345, 265]], 58), path([[210, 360], [135, 350], [75, 380]], 58), path([[210, 465], [280, 455], [345, 480]], 58)],
    ponds: [pond(75, 155, 'honey', 28), pond(345, 265, 'rose', 28), pond(75, 380, 'cream', 28), pond(345, 480, 'honey', 28), pond(210, 550, 'rose', 28)], rocks: [{ x: 208, y: 250, r: 17 }, { x: 213, y: 360, r: 17 }], exposed: exposed([210, 65], [210, 95]),
    gates: [{ x: 210, y: 195, width: 100, height: 25, pond: 0 }, { x: 210, y: 305, width: 100, height: 25, pond: 1 }, { x: 210, y: 415, width: 100, height: 25, pond: 2 }, { x: 210, y: 510, width: 100, height: 25, pond: 3 }],
  },
  {
    id: "terrasses-fleuries",
    title: "Les terrasses fleuries",
    hint: "Ouvre les écluses dans l’ordre et contourne les rochers pour atteindre toutes les mares.",
    source: [185,60],
    paths: [{"points": [[185,60],[185,120],[225,230],[185,340],[225,450],[210,555]],"width": 84},{"points": [[185,120],[128,135],[70,112]],"width": 60},{"points": [[225,230],[288,216],[350,240]],"width": 60},{"points": [[185,340],[128,326],[70,332]],"width": 60},{"points": [[225,450],[288,465],[350,460]],"width": 60}],
    ponds: [{"x": 70,"y": 112,"r": 27,"color": "honey"},{"x": 350,"y": 240,"r": 27,"color": "rose"},{"x": 70,"y": 332,"r": 27,"color": "cream"},{"x": 350,"y": 460,"r": 27,"color": "honey"},{"x": 210,"y": 555,"r": 29,"color": "rose"}],
    rocks: [{"x": 192,"y": 120,"r": 18},{"x": 218,"y": 230,"r": 18}],
    exposed: [[[185,60],[185,85],25]],
    gates: [{"x": 205.0,"y": 175.0,"width": 120,"height": 20,"pond": 0},{"x": 205.0,"y": 285.0,"width": 120,"height": 20,"pond": 1},{"x": 205.0,"y": 395.0,"width": 120,"height": 20,"pond": 2},{"x": 217.5,"y": 502.5,"width": 120,"height": 20,"pond": 3}]
  },
  {
    id: "ruisseau-des-fougeres",
    title: "Le ruisseau des fougères",
    hint: "Ouvre les écluses dans l’ordre et contourne les rochers pour atteindre toutes les mares.",
    source: [230,60],
    paths: [{"points": [[230,60],[230,120],[205,230],[175,340],[205,450],[210,555]],"width": 84},{"points": [[230,120],[290,106],[350,130]],"width": 60},{"points": [[205,230],[138,216],[70,222]],"width": 60},{"points": [[175,340],[122,355],[70,350]],"width": 60},{"points": [[205,450],[278,436],[350,442]],"width": 60}],
    ponds: [{"x": 350,"y": 130,"r": 27,"color": "rose"},{"x": 70,"y": 222,"r": 27,"color": "cream"},{"x": 70,"y": 350,"r": 27,"color": "honey"},{"x": 350,"y": 442,"r": 27,"color": "rose"},{"x": 210,"y": 555,"r": 29,"color": "rose"}],
    rocks: [{"x": 223,"y": 120,"r": 18},{"x": 212,"y": 230,"r": 18}],
    exposed: [[[230,60],[230,85],25]],
    gates: [{"x": 217.5,"y": 175.0,"width": 120,"height": 20,"pond": 0},{"x": 190.0,"y": 285.0,"width": 120,"height": 20,"pond": 1},{"x": 190.0,"y": 395.0,"width": 120,"height": 20,"pond": 2},{"x": 207.5,"y": 502.5,"width": 120,"height": 20,"pond": 3}]
  },
  {
    id: "detour-des-joncs",
    title: "Le détour des joncs",
    hint: "Ouvre les écluses dans l’ordre et contourne les rochers pour atteindre toutes les mares.",
    source: [180,60],
    paths: [{"points": [[180,60],[180,120],[225,230],[245,340],[200,450],[210,555]],"width": 84},{"points": [[180,120],[125,106],[70,112]],"width": 60},{"points": [[225,230],[288,245],[350,240]],"width": 60},{"points": [[245,340],[298,326],[350,332]],"width": 60},{"points": [[200,450],[135,436],[70,460]],"width": 60}],
    ponds: [{"x": 70,"y": 112,"r": 27,"color": "cream"},{"x": 350,"y": 240,"r": 27,"color": "honey"},{"x": 350,"y": 332,"r": 27,"color": "rose"},{"x": 70,"y": 460,"r": 27,"color": "cream"},{"x": 210,"y": 555,"r": 29,"color": "rose"}],
    rocks: [{"x": 187,"y": 120,"r": 18},{"x": 218,"y": 230,"r": 18},{"x": 252,"y": 340,"r": 18}],
    exposed: [[[180,60],[180,85],25]],
    gates: [{"x": 202.5,"y": 175.0,"width": 120,"height": 20,"pond": 0},{"x": 235.0,"y": 285.0,"width": 120,"height": 20,"pond": 1},{"x": 222.5,"y": 395.0,"width": 120,"height": 20,"pond": 2},{"x": 205.0,"y": 502.5,"width": 120,"height": 20,"pond": 3}]
  },
  {
    id: "jardin-des-galets",
    title: "Le jardin des galets",
    hint: "Ouvre les écluses dans l’ordre et contourne les rochers pour atteindre toutes les mares.",
    source: [210,60],
    paths: [{"points": [[210,60],[210,120],[180,230],[225,340],[190,450],[210,555]],"width": 84},{"points": [[210,120],[280,135],[350,130]],"width": 60},{"points": [[180,230],[125,216],[70,222]],"width": 60},{"points": [[225,340],[288,326],[350,350]],"width": 60},{"points": [[190,450],[130,465],[70,442]],"width": 60}],
    ponds: [{"x": 350,"y": 130,"r": 27,"color": "honey"},{"x": 70,"y": 222,"r": 27,"color": "rose"},{"x": 350,"y": 350,"r": 27,"color": "cream"},{"x": 70,"y": 442,"r": 27,"color": "honey"},{"x": 210,"y": 555,"r": 29,"color": "rose"}],
    rocks: [{"x": 203,"y": 120,"r": 18},{"x": 187,"y": 230,"r": 18},{"x": 218,"y": 340,"r": 18},{"x": 197,"y": 450,"r": 18}],
    exposed: [[[210,60],[210,85],25]],
    gates: [{"x": 195.0,"y": 175.0,"width": 120,"height": 20,"pond": 0},{"x": 202.5,"y": 285.0,"width": 120,"height": 20,"pond": 1},{"x": 207.5,"y": 395.0,"width": 120,"height": 20,"pond": 2},{"x": 200.0,"y": 502.5,"width": 120,"height": 20,"pond": 3}]
  },
  {
    id: "vallon-des-lucioles",
    title: "Le vallon des lucioles",
    hint: "Ouvre les écluses dans l’ordre et contourne les rochers pour atteindre toutes les mares.",
    source: [180,60],
    paths: [{"points": [[180,60],[180,120],[230,230],[180,340],[230,450],[210,555]],"width": 84},{"points": [[180,120],[125,106],[70,112]],"width": 60},{"points": [[230,230],[150,216],[70,240]],"width": 60},{"points": [[180,340],[265,355],[350,332]],"width": 60},{"points": [[230,450],[290,436],[350,460]],"width": 60}],
    ponds: [{"x": 70,"y": 112,"r": 27,"color": "rose"},{"x": 70,"y": 240,"r": 27,"color": "cream"},{"x": 350,"y": 332,"r": 27,"color": "honey"},{"x": 350,"y": 460,"r": 27,"color": "rose"},{"x": 210,"y": 555,"r": 29,"color": "rose"}],
    rocks: [{"x": 187,"y": 120,"r": 18},{"x": 223,"y": 230,"r": 18},{"x": 187,"y": 340,"r": 18}],
    exposed: [[[180,60],[180,85],25]],
    gates: [{"x": 205.0,"y": 175.0,"width": 120,"height": 20,"pond": 0},{"x": 205.0,"y": 285.0,"width": 120,"height": 20,"pond": 1},{"x": 205.0,"y": 395.0,"width": 120,"height": 20,"pond": 2},{"x": 220.0,"y": 502.5,"width": 120,"height": 20,"pond": 3}]
  },
  {
    id: "rives-cachees",
    title: "Les rives cachées",
    hint: "Ouvre les écluses dans l’ordre et contourne les rochers pour atteindre toutes les mares.",
    source: [235,60],
    paths: [{"points": [[235,60],[235,120],[185,230],[235,340],[185,450],[210,555]],"width": 84},{"points": [[235,120],[292,106],[350,130]],"width": 60},{"points": [[185,230],[268,245],[350,222]],"width": 60},{"points": [[235,340],[152,326],[70,350]],"width": 60},{"points": [[185,450],[128,436],[70,442]],"width": 60}],
    ponds: [{"x": 350,"y": 130,"r": 27,"color": "cream"},{"x": 350,"y": 222,"r": 27,"color": "honey"},{"x": 70,"y": 350,"r": 27,"color": "rose"},{"x": 70,"y": 442,"r": 27,"color": "cream"},{"x": 210,"y": 555,"r": 29,"color": "rose"}],
    rocks: [{"x": 228,"y": 120,"r": 18},{"x": 192,"y": 230,"r": 18},{"x": 228,"y": 340,"r": 18},{"x": 192,"y": 450,"r": 18}],
    exposed: [[[235,60],[235,85],25]],
    gates: [{"x": 210.0,"y": 175.0,"width": 120,"height": 20,"pond": 0},{"x": 210.0,"y": 285.0,"width": 120,"height": 20,"pond": 1},{"x": 210.0,"y": 395.0,"width": 120,"height": 20,"pond": 2},{"x": 197.5,"y": 502.5,"width": 120,"height": 20,"pond": 3}]
  },
  {
    id: "promenade-des-loutres",
    title: "La promenade des loutres",
    hint: "Ouvre les écluses dans l’ordre et contourne les rochers pour atteindre toutes les mares.",
    source: [185,60],
    paths: [{"points": [[185,60],[185,120],[215,230],[245,340],[210,450],[210,555]],"width": 84},{"points": [[185,120],[128,135],[70,112]],"width": 60},{"points": [[215,230],[282,216],[350,240]],"width": 60},{"points": [[245,340],[158,326],[70,332]],"width": 60},{"points": [[210,450],[280,465],[350,460]],"width": 60}],
    ponds: [{"x": 70,"y": 112,"r": 27,"color": "honey"},{"x": 350,"y": 240,"r": 27,"color": "rose"},{"x": 70,"y": 332,"r": 27,"color": "cream"},{"x": 350,"y": 460,"r": 27,"color": "honey"},{"x": 210,"y": 555,"r": 29,"color": "rose"}],
    rocks: [{"x": 192,"y": 120,"r": 18},{"x": 208,"y": 230,"r": 18},{"x": 252,"y": 340,"r": 18},{"x": 203,"y": 450,"r": 18}],
    exposed: [[[185,60],[185,85],25]],
    gates: [{"x": 200.0,"y": 175.0,"width": 120,"height": 20,"pond": 0},{"x": 230.0,"y": 285.0,"width": 120,"height": 20,"pond": 1},{"x": 227.5,"y": 395.0,"width": 120,"height": 20,"pond": 2},{"x": 210.0,"y": 502.5,"width": 120,"height": 20,"pond": 3}]
  },
  {
    id: "verger-des-meandres",
    title: "Le verger des méandres",
    hint: "Ouvre les écluses dans l’ordre et contourne les rochers pour atteindre toutes les mares.",
    source: [235,60],
    paths: [{"points": [[235,60],[235,120],[205,230],[175,340],[205,450],[210,555]],"width": 84},{"points": [[235,120],[292,106],[350,130]],"width": 60},{"points": [[205,230],[138,216],[70,222]],"width": 60},{"points": [[175,340],[262,355],[350,350]],"width": 60},{"points": [[205,450],[138,436],[70,442]],"width": 60}],
    ponds: [{"x": 350,"y": 130,"r": 27,"color": "rose"},{"x": 70,"y": 222,"r": 27,"color": "cream"},{"x": 350,"y": 350,"r": 27,"color": "honey"},{"x": 70,"y": 442,"r": 27,"color": "rose"},{"x": 210,"y": 555,"r": 29,"color": "rose"}],
    rocks: [{"x": 228,"y": 120,"r": 18},{"x": 212,"y": 230,"r": 18},{"x": 168,"y": 340,"r": 18},{"x": 212,"y": 450,"r": 18}],
    exposed: [[[235,60],[235,85],25]],
    gates: [{"x": 220.0,"y": 175.0,"width": 120,"height": 20,"pond": 0},{"x": 190.0,"y": 285.0,"width": 120,"height": 20,"pond": 1},{"x": 190.0,"y": 395.0,"width": 120,"height": 20,"pond": 2},{"x": 207.5,"y": 502.5,"width": 120,"height": 20,"pond": 3}]
  },
  {
    id: "cinq-portes",
    title: "Les cinq portes du jardin",
    hint: "Ouvre les écluses dans l’ordre et contourne les rochers pour atteindre toutes les mares.",
    source: [190,60],
    paths: [{"points": [[190,60],[190,110],[225,200],[190,290],[225,380],[190,470],[210,555]],"width": 78},{"points": [[190,110],[130,110],[70,110]],"width": 60},{"points": [[225,200],[288,200],[350,200]],"width": 60},{"points": [[190,290],[130,290],[70,290]],"width": 60},{"points": [[225,380],[288,380],[350,380]],"width": 60},{"points": [[190,470],[130,470],[70,470]],"width": 60}],
    ponds: [{"x": 70,"y": 110,"r": 27,"color": "cream"},{"x": 350,"y": 200,"r": 27,"color": "honey"},{"x": 70,"y": 290,"r": 27,"color": "rose"},{"x": 350,"y": 380,"r": 27,"color": "cream"},{"x": 70,"y": 470,"r": 27,"color": "honey"},{"x": 210,"y": 555,"r": 29,"color": "rose"}],
    rocks: [{"x": 197,"y": 110,"r": 16},{"x": 218,"y": 200,"r": 16},{"x": 197,"y": 290,"r": 16}],
    exposed: [[[190,60],[190,85],25]],
    gates: [{"x": 207.5,"y": 155.0,"width": 120,"height": 20,"pond": 0},{"x": 207.5,"y": 245.0,"width": 120,"height": 20,"pond": 1},{"x": 207.5,"y": 335.0,"width": 120,"height": 20,"pond": 2},{"x": 207.5,"y": 425.0,"width": 120,"height": 20,"pond": 3},{"x": 200.0,"y": 512.5,"width": 120,"height": 20,"pond": 4}]
  },
  {
    id: "sources-des-collines",
    title: "Les sources des collines",
    hint: "Ouvre les écluses dans l’ordre et contourne les rochers pour atteindre toutes les mares.",
    source: [230,60],
    paths: [{"points": [[230,60],[230,110],[200,200],[180,290],[210,380],[235,470],[210,555]],"width": 78},{"points": [[230,110],[290,110],[350,110]],"width": 60},{"points": [[200,200],[135,200],[70,200]],"width": 60},{"points": [[180,290],[125,290],[70,290]],"width": 60},{"points": [[210,380],[280,380],[350,380]],"width": 60},{"points": [[235,470],[292,470],[350,470]],"width": 60}],
    ponds: [{"x": 350,"y": 110,"r": 27,"color": "honey"},{"x": 70,"y": 200,"r": 27,"color": "rose"},{"x": 70,"y": 290,"r": 27,"color": "cream"},{"x": 350,"y": 380,"r": 27,"color": "honey"},{"x": 350,"y": 470,"r": 27,"color": "rose"},{"x": 210,"y": 555,"r": 29,"color": "rose"}],
    rocks: [{"x": 223,"y": 110,"r": 16},{"x": 207,"y": 200,"r": 16},{"x": 173,"y": 290,"r": 16},{"x": 217,"y": 380,"r": 16}],
    exposed: [[[230,60],[230,85],25]],
    gates: [{"x": 215.0,"y": 155.0,"width": 120,"height": 20,"pond": 0},{"x": 190.0,"y": 245.0,"width": 120,"height": 20,"pond": 1},{"x": 195.0,"y": 335.0,"width": 120,"height": 20,"pond": 2},{"x": 222.5,"y": 425.0,"width": 120,"height": 20,"pond": 3},{"x": 222.5,"y": 512.5,"width": 120,"height": 20,"pond": 4}]
  },
  {
    id: "grand-tour-des-mares",
    title: "Le grand tour des mares",
    hint: "Ouvre les écluses dans l’ordre et contourne les rochers pour atteindre toutes les mares.",
    source: [180,60],
    paths: [{"points": [[180,60],[180,110],[215,200],[240,290],[210,380],[180,470],[210,555]],"width": 78},{"points": [[180,110],[125,110],[70,110]],"width": 60},{"points": [[215,200],[282,200],[350,200]],"width": 60},{"points": [[240,290],[295,290],[350,290]],"width": 60},{"points": [[210,380],[140,380],[70,380]],"width": 60},{"points": [[180,470],[125,470],[70,470]],"width": 60}],
    ponds: [{"x": 70,"y": 110,"r": 27,"color": "rose"},{"x": 350,"y": 200,"r": 27,"color": "cream"},{"x": 350,"y": 290,"r": 27,"color": "honey"},{"x": 70,"y": 380,"r": 27,"color": "rose"},{"x": 70,"y": 470,"r": 27,"color": "cream"},{"x": 210,"y": 555,"r": 29,"color": "rose"}],
    rocks: [{"x": 187,"y": 110,"r": 16},{"x": 208,"y": 200,"r": 16},{"x": 247,"y": 290,"r": 16},{"x": 203,"y": 380,"r": 16},{"x": 187,"y": 470,"r": 16}],
    exposed: [[[180,60],[180,85],25]],
    gates: [{"x": 197.5,"y": 155.0,"width": 120,"height": 20,"pond": 0},{"x": 227.5,"y": 245.0,"width": 120,"height": 20,"pond": 1},{"x": 225.0,"y": 335.0,"width": 120,"height": 20,"pond": 2},{"x": 195.0,"y": 425.0,"width": 120,"height": 20,"pond": 3},{"x": 195.0,"y": 512.5,"width": 120,"height": 20,"pond": 4}]
  },
  {
    id: "royaume-des-rivieres",
    title: "Le royaume des rivières",
    hint: "Ouvre les écluses dans l’ordre et contourne les rochers pour atteindre toutes les mares.",
    source: [210,60],
    paths: [{"points": [[210,60],[210,110],[180,200],[225,290],[185,380],[220,470],[210,555]],"width": 78},{"points": [[210,110],[280,110],[350,110]],"width": 60},{"points": [[180,200],[125,200],[70,200]],"width": 60},{"points": [[225,290],[288,290],[350,290]],"width": 60},{"points": [[185,380],[128,380],[70,380]],"width": 60},{"points": [[220,470],[285,470],[350,470]],"width": 60}],
    ponds: [{"x": 350,"y": 110,"r": 27,"color": "cream"},{"x": 70,"y": 200,"r": 27,"color": "honey"},{"x": 350,"y": 290,"r": 27,"color": "rose"},{"x": 70,"y": 380,"r": 27,"color": "cream"},{"x": 350,"y": 470,"r": 27,"color": "honey"},{"x": 210,"y": 555,"r": 29,"color": "rose"}],
    rocks: [{"x": 203,"y": 110,"r": 16},{"x": 187,"y": 200,"r": 16},{"x": 218,"y": 290,"r": 16},{"x": 192,"y": 380,"r": 16},{"x": 213,"y": 470,"r": 16}],
    exposed: [[[210,60],[210,85],25]],
    gates: [{"x": 195.0,"y": 155.0,"width": 120,"height": 20,"pond": 0},{"x": 202.5,"y": 245.0,"width": 120,"height": 20,"pond": 1},{"x": 205.0,"y": 335.0,"width": 120,"height": 20,"pond": 2},{"x": 202.5,"y": 425.0,"width": 120,"height": 20,"pond": 3},{"x": 215.0,"y": 512.5,"width": 120,"height": 20,"pond": 4}]
  },
];
