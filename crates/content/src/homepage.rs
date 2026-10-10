//! Homepage records explicitly extracted from the legacy config; no runtime YAML dependency.
use crate::{
    Homepage, Image, Link, Markdown, Profile, ProfileLink, ProfileLinkKind, ProjectMetadata,
    ResumeEntry, ResumeKind, ResumeSection,
};

pub const HOMEPAGE: Homepage = Homepage {
    profile: Profile {
        name: "Jeremy Somsouk",
        role: "Software engineer",
        email: "jeremy@somsouk.fr",
        image: Image {
            src: "/images/profile.webp",
            alt: "Jeremy Somsouk",
            width: 1024,
            height: 1024,
        },
        about: Markdown(include_str!("../../../content/home/about.md")),
        links: &[
            ProfileLink {
                kind: ProfileLinkKind::GitHub,
                label: "GitHub",
                url: "https://github.com/JeremySomsouk",
            },
            ProfileLink {
                kind: ProfileLinkKind::LinkedIn,
                label: "LinkedIn",
                url: "https://www.linkedin.com/in/jeremy-somsouk-dev",
            },
            ProfileLink {
                kind: ProfileLinkKind::Home,
                label: "La cabane à découvertes",
                url: "/cabane/",
            },
        ],
    },
    projects_title: "Things I’m building",
    projects_id: "personal-projects",
    projects: &[
        ProjectMetadata {
            slug: "bientot",
            heading_id: "bientot-title",
            title: "Bientôt",
            tagline: "Bientôt, à nous.",
            description: "A collaborative checklist for expectant and new parents, designed first for France. Prepare practical steps, organize everyday tasks, and get ready for your child together. Baby registries and product links will complement the preparation.",
            tags: &["Family preparation", "Android & web", "Rust & TypeScript"],
            tags_label: "Bientôt purpose and technologies",
            note: Some(
                "In development and privately tested. The public website introduces the project; the application is not yet publicly available.",
            ),
            destination: Link {
                label: "Discover Bientôt →",
                url: "https://bientotanous.app/",
            },
            image: Image {
                src: "/images/bientot-banner.png",
                alt: "Bientôt’s existing symbol with the words Faire une place. Ensemble. on a warm porcelain background",
                width: 1200,
                height: 630,
            },
        },
        ProjectMetadata {
            slug: "tessera",
            heading_id: "tessera-title",
            title: "Tessera",
            tagline: "Your terminals. Your specs. Your agents.",
            description: "A native terminal workspace built in Rust for Claude Code and Codex. Arrange shells in resizable panes, group agent sessions around work items, and use Work to see what needs your attention. Choose each stage from Define to Deliver, prepare specifications, save revisions, and launch an agent with the scope you chose. Work items and linked history stay saved locally when terminals close or the app restarts.",
            tags: &["Rust", "macOS & Linux", "Claude Code & Codex"],
            tags_label: "Tessera technologies and integrations",
            note: Some("Version 0.6.0 · Intel and ARM64 · One-command installation."),
            destination: Link {
                label: "Explore on GitHub →",
                url: "https://github.com/JeremySomsouk/tessera",
            },
            image: Image {
                src: "/images/tessera-banner.webp",
                alt: "Tessera’s mint and amber tiled T identity on an ink-blue terminal pane mosaic",
                width: 2172,
                height: 724,
            },
        },
        ProjectMetadata {
            slug: "melimo",
            heading_id: "melimo-title",
            title: "Mélimo",
            tagline: "Your music, in your terminal.",
            description: "A lightweight music player built in Rust. Search and stream music, build your queue, and control playback from your keyboard. Explore playlists and follow synchronized lyrics when available.",
            tags: &["Rust", "Terminal UI", "macOS & Linux"],
            tags_label: "Mélimo technologies and platforms",
            note: Some("Available on macOS and Linux."),
            destination: Link {
                label: "Explore on GitHub →",
                url: "https://github.com/JeremySomsouk/Melimo",
            },
            image: Image {
                src: "/images/melimo-player.png",
                alt: "Mélimo terminal player showing a music queue and synchronized lyrics with fictional demo tracks",
                width: 1024,
                height: 654,
            },
        },
        ProjectMetadata {
            slug: "cabane",
            heading_id: "cabane-title",
            title: "La cabane à découvertes",
            tagline: "A little place to learn, play, and explore.",
            description: "A collection of playful browser activities for curious minds. Practice reading, match illustrated cards, solve puzzles, and experiment with light and water.",
            tags: &[
                "Learning through play",
                "Browser games",
                "Rust & WebAssembly",
            ],
            tags_label: "Cabane features and technologies",
            note: None,
            destination: Link {
                label: "Enter the cabane →",
                url: "/cabane/",
            },
            image: Image {
                src: "/cabane/images/welcome.webp",
                alt: "Illustrated welcome to La cabane à découvertes",
                width: 800,
                height: 800,
            },
        },
        ProjectMetadata {
            slug: "prctrl",
            heading_id: "prctrl-title",
            title: "PRCtrl",
            tagline: "Pull requests. Under control.",
            description: "A Rust command-line tool for managing GitHub pull requests. Browse reviews in an interactive terminal UI, filter across repositories and teams, and keep track of what needs your attention.",
            tags: &["Rust", "Terminal UI", "GitHub"],
            tags_label: "PRCtrl technologies and integrations",
            note: None,
            destination: Link {
                label: "Explore on GitHub →",
                url: "https://github.com/JeremySomsouk/prctrl",
            },
            image: Image {
                src: "/images/prctrl-banner.webp",
                alt: "PRCtrl banner with a terminal prompt and a green pull request symbol",
                width: 2172,
                height: 724,
            },
        },
    ],
    resume: &[
        ResumeSection {
            kind: ResumeKind::Experience,
            entries: &[
                ResumeEntry {
                    heading_id: "doctolib",
                    title: "Doctolib",
                    subtitle: "Software engineer",
                    period: "2026 - Present",
                    url: Some("https://doctolib.fr"),
                    description: Markdown(include_str!("../../../content/home/doctolib.md")),
                },
                ResumeEntry {
                    heading_id: "blablacar",
                    title: "BlaBlaCar",
                    subtitle: "Software engineer",
                    period: "2020 - 2025",
                    url: Some("https://blablacar.com"),
                    description: Markdown(include_str!("../../../content/home/blablacar.md")),
                },
                ResumeEntry {
                    heading_id: "streamroot-lumen",
                    title: "Streamroot Lumen",
                    subtitle: "Software engineer",
                    period: "2022",
                    url: Some("https://streamroot.io"),
                    description: Markdown(include_str!(
                        "../../../content/home/streamroot-lumen.md"
                    )),
                },
                ResumeEntry {
                    heading_id: "happn",
                    title: "Happn",
                    subtitle: "Software engineer",
                    period: "2017 - 2020",
                    url: Some("https://happn.com"),
                    description: Markdown(include_str!("../../../content/home/happn.md")),
                },
            ],
        },
        ResumeSection {
            kind: ResumeKind::Education,
            entries: &[ResumeEntry {
                heading_id: "epita",
                title: "EPITA",
                subtitle: "Systems, Networks and Security Engineer diploma",
                period: "2012 - 2017",
                url: None,
                description: Markdown(include_str!("../../../content/home/epita.md")),
            }],
        },
    ],
    hobbies_title: "A Little More About Me",
    hobbies: Markdown(include_str!("../../../content/home/hobbies.md")),
};
