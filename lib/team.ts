export type TeamMember = {
  slug: string;
  name: string;
  title: string;
  image: string;
  linkedin?: string;
  twitter?: string;
  description: string[];
};

export const TEAM: TeamMember[] = [
  {
    slug: "max-kahn",
    name: "Max Kahn",
    title: "Chief Executive Officer",
    image: "/team/max-kahn.jpg",
    description: [
      "Max Kahn is the Chief Executive Officer of Digital Wealth Partners. With over a decade of experience in financial services and business strategy, Max specializes in guiding institutions and individuals through the evolving digital asset landscape.",
      "Before joining DWP, Max served as Director of Strategy at Digital Asset Research and at YieldX, where he led institutional partnerships, product launches, and oversaw compliance processes.",
      "Max also contributes thought leadership on digital asset strategies and has been pivotal in launching groundbreaking indexes and financial solutions. He is a licensed securities professional.",
    ],
  },
  {
    slug: "matthew-snider",
    name: "Matthew Snider",
    title: "Chief Investment Officer",
    image: "/team/matthew-snider.jpg",
    linkedin: "https://www.linkedin.com/in/matthewjamessnider/",
    description: [
      'Matthew Snider is the Chief Investment Officer of Digital Wealth Partners. He is a Registered Investment Advisor Representative, public speaker, guest lecturer, and published author of "Warren Buffet in a Web3 World".',
      "Matthew began his post-MBA career as a management consultant at both Big4 and boutique firms specializing in financial risk management and marketing data analytics.",
      "He received his MBA from Loyola Marymount University and his BA in economics from Boston University.",
    ],
  },
  {
    slug: "connor-mclaughlin",
    name: "Connor McLaughlin",
    title: "Wealth Advisor",
    image: "/team/connor-mclaughlin.jpg",
    linkedin: "https://www.linkedin.com/in/connor-b-mclaughlin/",
    twitter: "https://x.com/xrpmickle",
    description: [
      "Connor McLaughlin brings a unique blend of technical expertise and financial acumen to Digital Wealth Partners.",
      "He has successfully navigated the complex worlds of stock and cryptocurrency investing, earning a reputation for his strategic approach.",
      "Connor is passionate about guiding clients through the dynamic landscape of modern finance.",
    ],
  },
  {
    slug: "tom-teal",
    name: "Tom Teal",
    title: "Head of Financial Planning",
    image: "/team/tom-teal.jpg",
    description: [
      "Tom Teal leads the financial planning initiatives at Digital Wealth Partners.",
      "With his extensive background in financial planning and wealth management, Tom helps clients develop comprehensive strategies that incorporate both traditional and digital assets.",
      "He focuses on creating personalized financial plans that adapt to the changing investment landscape while maintaining strong risk management principles.",
    ],
  },
  {
    slug: "fred-weisbrod",
    name: "Fred Weisbrod",
    title: "Wealth Advisor",
    image: "/team/fred-weisbrod.jpg",
    linkedin: "https://www.linkedin.com/in/fredweisbrod/",
    description: [
      "Fred Weisbrod brings extensive experience in wealth management and digital assets to Digital Wealth Partners.",
      "His comprehensive understanding of both traditional and digital investment strategies helps clients navigate the evolving financial landscape.",
      "Fred is dedicated to providing personalized wealth management solutions that align with clients' long-term financial goals.",
    ],
  },
];
