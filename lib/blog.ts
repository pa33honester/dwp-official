export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  category: "News" | "General";
  excerpt: string;
  image: string | null;
  body?: string[];
};

export const POSTS: BlogPost[] = [
  {
    slug: "max-kahn-ceo",
    title: "Digital Wealth Partners Appoints Max Kahn as Chief Executive Officer",
    date: "July 8, 2025",
    category: "News",
    excerpt:
      "Digital Wealth Partners has announced the appointment of Max Kahn as its new Chief Executive Officer. Kahn transitions from his role as [...]",
    image: "/blog/max-kahn-ceo.jpg",
  },
  {
    slug: "debt-reduction-plan",
    title: "How to Make a Debt Reduction Plan that Works for You",
    date: "June 27, 2025",
    category: "General",
    excerpt:
      "Staring at a pile of bills and feeling like you're drowning? I get it. Debt has this sneaky way of [...]",
    image: null,
  },
  {
    slug: "new-partnership-models",
    title:
      "Digital Wealth Partners Announces New Partnership Models for RIAs to Access Digital Asset Expertise",
    date: "April 16, 2025",
    category: "News",
    excerpt:
      "Digital Wealth Partners (DWP), a provider of digital asset investment solutions, announces the launch of partnership models designed for Registered [...]",
    image: "/blog/partnership-models.jpg",
  },
  {
    slug: "crypto-iras-guide",
    title: "A Guide to Crypto-Based IRAs",
    date: "April 12, 2025",
    category: "General",
    excerpt:
      "What is a Crypto-Based IRA? A crypto-based IRA combines the tax advantages of traditional Individual Retirement Accounts (IRAs) with the [...]",
    image: "/blog/crypto-ira.jpg",
  },
  {
    slug: "xlm-custody-support",
    title:
      "Digital Wealth Partners Enables Access to Custody Support for Stellar Lumens (XLM)",
    date: "April 3, 2025",
    category: "News",
    excerpt:
      "Digital Wealth Partners is pleased to announce that clients can now access custody support for Stellar Lumens (XLM) through its [...]",
    image: "/blog/xlm-custody.jpg",
  },
];
