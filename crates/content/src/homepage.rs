//! Homepage records explicitly extracted from the legacy config; no runtime YAML dependency.
use crate::{
    Homepage, Image, Link, Markdown, Profile, ProjectMetadata, ResumeEntry, ResumeKind,
    ResumeSection,
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
            Link {
                label: "GitHub",
                url: "https://github.com/JeremySomsouk",
            },
            Link {
                label: "LinkedIn",
                url: "https://www.linkedin.com/in/jeremy-somsouk-dev",
            },
            Link {
                label: "La cabane à découvertes",
                url: "https://www.somsouk.fr/cabane/",
            },
            Link {
                label: "You're never gonna believe me",
                url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            },
        ],
    },
    projects_title: "Things I’m building",
    projects_id: "personal-projects",
    projects: &[
        ProjectMetadata {
            slug: "melimo",
            heading_id: "melimo-title",
            title: "Mélimo",
            tagline: "Your music, in your terminal.",
            description: "A lightweight music player built in Rust. Search and stream audio with Deezer or Invidious, build one queue, and control playback from your keyboard. Explore your Deezer playlists and follow synchronized lyrics when available.",
            tags: &["Rust", "Terminal UI", "macOS & Linux"],
            tags_label: "Mélimo technologies and platforms",
            note: Some(
                "Invidious instances are selected automatically for audio streaming. An unofficial client for both providers.",
            ),
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
