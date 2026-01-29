export const UPDATES = [
    {
        id: 12,
        version: "2.0.9",
        date: "29 Janv. 2026",
        title: "Chat Privé & Notifications Premium",
        description: "Communiquez en temps réel avec vos amis sans quitter votre partie.",
        isNew: true,
        type: "major",
        changes: [
            { text: "Chat Privé : Interface style WhatsApp pour discuter en direct", type: "feat" },
            { text: "Chat In-Game : Lis et réponds aux messages sans quitter ta partie", type: "feat" },
            { text: "Notifications Premium : Nouveau bandeau élégant et discret", type: "improve" },
            { text: "Sync Multi-onglets : Synchronisation parfaite entre tes écrans", type: "improve" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 11,
        version: "2.0.0",
        date: "28 Janv. 2026",
        title: "Skyjo V2 : Le Grand Lancement",
        description: "L'expérience Skyjo ultime est là. Mode social, persistance Cloud et design ultra-premium.",
        isNew: false,
        type: "major",
        changes: [
            { text: "SkyID : Crée ton identité unique et retrouve tes amis", type: "feat" },
            { text: "Cloud Sync : Tes niveaux et scores sont désormais sauvegardés en ligne", type: "feat" },
            { text: "Hub Social : Liste d'amis, classement mondial et invitations en temps réel", type: "feat" },
            { text: "Feedback Hub : Une nouvelle interface pour nous aider à améliorer le jeu", type: "feat" },
            { text: "PWA v2 : Icônes modernisées et stabilité de l'application accrue", type: "improve" },
            { text: "Design Glassmorphism : Une interface plus fluide, sombre et élégante", type: "improve" },
            { text: "Règles du Jeu : Accès direct aux règles depuis le menu", type: "fix" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 10,
        version: "1.9.5",
        date: "27 Janv. 2026",
        title: "Optimisation Sociale",
        description: "Amélioration de la fiabilité des invitations et de la présence en ligne.",
        isNew: false,
        type: "minor",
        changes: [
            { text: "Invitations Atomiques via serveur", type: "feat" },
            { text: "Gestion multi-appareils stabilisée", type: "improve" },
            { text: "Auto-SkyID pour les nouveaux joueurs", type: "fix" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 9,
        version: "1.9.0",
        date: "26 Janv. 2026",
        title: "Stats & UI Premium",
        description: "Refonte du design et ajout du podium des leaders.",
        isNew: false,
        type: "minor",
        changes: [
            { text: "Podium interactif et graphiques d'évolution", type: "feat" },
            { text: "Historique unifié et Hero Header", type: "improve" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 7,
        version: "1.1.0",
        date: "15 Janv. 2025",
        title: "IA Améliorée",
        description: "L'IA prend désormais des décisions plus intelligentes basées sur les probabilités.",
        type: "improvement",
        changes: [
            { text: "Algorithme de l'IA optimisé", type: "improve" },
            { text: "Meilleure gestion de la défausse", type: "improve" },
            { text: "Corrections de bugs mineurs", type: "fix" }
        ]
    }
];
