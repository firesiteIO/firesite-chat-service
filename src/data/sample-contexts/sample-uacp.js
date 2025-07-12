/**
 * Sample UACP (Universal AI Context Profile) for testing
 * These provide company and product context for AI systems
 */

export const sampleUACPContexts = {
  // Firesite Company Profile
  firesiteProfile: `[UACP:COMPANY-PROFILE v1.0]
{
  "metadata": {
    "version": "1.0",
    "last_updated": "2024-12-15T10:00:00Z",
    "language": "en",
    "ttl": 86400,
    "refresh_url": "https://firesite.ai/uacp/company-profile"
  },
  "company": {
    "name": "Firesite",
    "tagline": "Infrastructure for Human Potential",
    "description": "Firesite is building a fundamentally new paradigm in technology - one that inverts the traditional relationship between humans and software. Our mission is to create systems that adapt to humans, rather than forcing humans to adapt to static technology.",
    "founded": "2024",
    "website": "https://firesite.ai",
    "social": {
      "github": "https://github.com/firesiteio",
      "twitter": "https://twitter.com/firesiteai"
    },
    "values": [
      "AI as a First-Class Team Member",
      "Context Preservation as Foundation",
      "Immutable Attribution Through Blockchain",
      "Adaptive Systems Over Rigid Methodologies",
      "Unified Creator/User Paradigm",
      "Self-Improving Technology"
    ],
    "team": [
      {
        "name": "Thomas Butler",
        "role": "Founder & Chief Architect",
        "bio": "Visionary behind the human-AI collaboration paradigm",
        "contact": {
          "github": "https://github.com/thomasbutler"
        }
      }
    ],
    "industries": ["Software Development", "AI Technology", "Developer Tools"],
    "locations": [
      {
        "name": "Digital Headquarters",
        "country": "Global",
        "type": "remote"
      }
    ]
  },
  "products": [
    {
      "name": "Firesite Chat Service",
      "description": "Revolutionary streaming markdown interface with zero re-renders and intelligent progressive replay",
      "features": [
        "Zero DOM re-renders",
        "120ms perception window compliance",
        "Intelligent ordered list detection",
        "Progressive markdown parsing",
        "SSE streaming architecture",
        "Real-time syntax highlighting"
      ],
      "use_cases": [
        "AI chat interfaces",
        "Real-time documentation",
        "Collaborative editing",
        "Live content streaming"
      ],
      "pricing": {
        "model": "free",
        "details_url": "https://firesite.ai/pricing"
      },
      "documentation_urls": [
        {
          "title": "Developer Guide",
          "url": "https://github.com/firesiteio/firesite-chat-service/blob/main/README.md",
          "description": "Complete setup and usage guide"
        }
      ],
      "api_endpoints": [
        {
          "name": "Streaming API",
          "description": "Server-sent events for real-time streaming",
          "base_url": "http://localhost:5173",
          "authentication": "none"
        }
      ],
      "tech_stack": ["JavaScript", "HTML5", "CSS3", "Vite", "SSE"],
      "status": "production"
    },
    {
      "name": "MCP Max Server",
      "description": "Enhanced Model Context Protocol server supporting multiple AI instances with different contexts",
      "features": [
        "Multi-session AI management",
        "Context object injection (MMCO, UACP)",
        "AI team member roles",
        "Dynamic system prompts",
        "Session-based state management",
        "Real-time SSE communication"
      ],
      "use_cases": [
        "Multi-AI coordination",
        "Context-aware AI interactions",
        "Team-based AI workflows",
        "Project-specific AI assistants"
      ],
      "api_endpoints": [
        {
          "name": "Session Management API",
          "description": "Create and manage AI sessions",
          "base_url": "http://localhost:3002",
          "authentication": "none"
        }
      ],
      "tech_stack": ["TypeScript", "Express.js", "MCP SDK", "SSE"],
      "status": "beta"
    },
    {
      "name": "Code Vault",
      "description": "Flutter component management system with GitHub Gist integration and Kanban board",
      "features": [
        "Component storage and retrieval",
        "GitHub Gist integration",
        "Kanban project management",
        "AI assistant integration",
        "Cross-platform compatibility"
      ],
      "tech_stack": ["Flutter", "Dart", "Firebase", "GitHub API"],
      "status": "alpha"
    }
  ],
  "content": {
    "blog_posts": [
      {
        "title": "The Future of Human-AI Collaboration",
        "summary": "Exploring the vision behind Firesite's revolutionary approach to adaptive technology",
        "url": "https://firesite.ai/blog/future-human-ai-collaboration",
        "published_date": "2024-12-01",
        "authors": ["Thomas Butler"],
        "tags": ["AI", "collaboration", "future-tech"]
      }
    ],
    "case_studies": [
      {
        "title": "Zero Re-renders: Revolutionizing Chat Interfaces",
        "summary": "How Firesite Chat Service achieved 100% accuracy in ordered list rendering",
        "url": "https://firesite.ai/case-studies/zero-re-renders",
        "industry": "Software Development",
        "results": [
          "100% accuracy in markdown rendering",
          "50ms improvement in first character latency",
          "Zero DOM thrashing"
        ]
      }
    ],
    "testimonials": [
      {
        "quote": "Firesite is building the future of how humans and AI work together. Their streaming technology is revolutionary.",
        "author": "Claude",
        "company": "Anthropic",
        "role": "AI Assistant"
      }
    ]
  },
  "support": {
    "contact_methods": [
      {
        "channel": "email",
        "value": "support@firesite.ai",
        "availability": "24/7",
        "description": "General support and inquiries"
      },
      {
        "channel": "chat",
        "value": "https://firesite.ai/chat",
        "availability": "24/7",
        "description": "Live chat with AI assistants"
      }
    ],
    "support_hours": "24/7 AI-powered support",
    "response_time": "< 1 hour"
  },
  "mcp_integrations": {
    "servers": [
      {
        "name": "Firesite MCP Base",
        "description": "Open source MCP server for basic AI interactions",
        "url": "http://localhost:3001",
        "documentation": "https://github.com/firesiteio/firesite-mcp",
        "version": "1.0.0",
        "authentication": "none"
      },
      {
        "name": "Firesite MCP Max",
        "description": "Enhanced MCP server with multi-session support",
        "url": "http://localhost:3002",
        "documentation": "https://github.com/firesiteio/firesite-mcp-max",
        "version": "0.2.0",
        "authentication": "none"
      }
    ]
  }
}
[/UACP:COMPANY-PROFILE]`,

  // Tech Startup Profile (Example)
  techStartupProfile: `[UACP:COMPANY-PROFILE v1.0]
{
  "metadata": {
    "version": "1.0",
    "last_updated": "2024-12-15T10:00:00Z",
    "language": "en",
    "ttl": 86400
  },
  "company": {
    "name": "TechFlow Innovations",
    "tagline": "Streamlining Developer Workflows",
    "description": "We build tools that make developers more productive by automating repetitive tasks and providing intelligent insights.",
    "founded": "2023",
    "website": "https://techflow.dev",
    "values": [
      "Developer-first design",
      "Automation over repetition",
      "Open source contribution",
      "Community-driven development"
    ],
    "industries": ["Developer Tools", "Software Development", "Automation"],
    "locations": [
      {
        "name": "San Francisco HQ",
        "city": "San Francisco",
        "country": "USA",
        "type": "headquarters"
      }
    ]
  },
  "products": [
    {
      "name": "FlowBot",
      "description": "AI-powered code review and optimization tool",
      "features": [
        "Automated code review",
        "Performance optimization suggestions",
        "Security vulnerability detection",
        "Integration with popular IDEs"
      ],
      "pricing": {
        "model": "freemium",
        "tiers": [
          {
            "name": "Free",
            "price": "$0",
            "interval": "monthly",
            "features": ["Basic code review", "5 repos", "Community support"]
          },
          {
            "name": "Pro",
            "price": "$29",
            "interval": "monthly",
            "features": ["Advanced analysis", "Unlimited repos", "Priority support"]
          }
        ]
      },
      "status": "production"
    }
  ]
}
[/UACP:COMPANY-PROFILE]`,

  // E-commerce Platform Profile (Example)
  ecommerceProfile: `[UACP:COMPANY-PROFILE v1.0]
{
  "metadata": {
    "version": "1.0",
    "last_updated": "2024-12-15T10:00:00Z",
    "language": "en",
    "ttl": 86400
  },
  "company": {
    "name": "ShopSmart Solutions",
    "tagline": "Intelligent E-commerce Platform",
    "description": "AI-powered e-commerce platform that helps businesses create personalized shopping experiences and optimize conversions.",
    "founded": "2022",
    "website": "https://shopsmart.io",
    "values": [
      "Customer-centric design",
      "Data-driven insights",
      "Scalable solutions",
      "Merchant success"
    ],
    "industries": ["E-commerce", "Retail Technology", "AI/ML"],
    "locations": [
      {
        "name": "Austin Office",
        "city": "Austin",
        "country": "USA",
        "type": "headquarters"
      }
    ]
  },
  "products": [
    {
      "name": "SmartStore Platform",
      "description": "Complete e-commerce solution with AI-powered recommendations",
      "features": [
        "Drag-and-drop store builder",
        "AI product recommendations",
        "Inventory management",
        "Analytics dashboard",
        "Mobile-responsive design"
      ],
      "pricing": {
        "model": "subscription",
        "tiers": [
          {
            "name": "Starter",
            "price": "$29",
            "interval": "monthly",
            "features": ["Up to 100 products", "Basic analytics", "Email support"]
          },
          {
            "name": "Growth",
            "price": "$79",
            "interval": "monthly",
            "features": ["Up to 1000 products", "AI recommendations", "Priority support"]
          },
          {
            "name": "Enterprise",
            "price": "Custom",
            "interval": "monthly",
            "features": ["Unlimited products", "Custom integrations", "Dedicated support"]
          }
        ]
      },
      "status": "production"
    }
  ]
}
[/UACP:COMPANY-PROFILE]`
};

export const parseUACPContext = (uacpText) => {
  try {
    const regex = /\[UACP:([A-Z-]+)\s+v([0-9.]+)\]([\\s\\S]*?)\[\/UACP:\1\]/;
    const match = uacpText.match(regex);
    
    if (!match) {
      throw new Error('Invalid UACP format');
    }
    
    const [_, type, version, jsonData] = match;
    const data = JSON.parse(jsonData);
    
    return {
      type,
      version,
      data,
      parsed: true
    };
  } catch (error) {
    console.error('Error parsing UACP context:', error);
    return null;
  }
};

export const createCustomUACP = (companyName, options = {}) => {
  const customProfile = {
    metadata: {
      version: "1.0",
      last_updated: new Date().toISOString(),
      language: "en",
      ttl: 86400
    },
    company: {
      name: companyName,
      tagline: options.tagline || `${companyName} - Custom Company`,
      description: options.description || `Custom company profile for ${companyName}`,
      website: options.website || `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      values: options.values || ["Innovation", "Quality", "Customer Focus"],
      industries: options.industries || ["Technology"],
      ...options.company
    },
    products: options.products || [],
    ...options.additional
  };

  return `[UACP:COMPANY-PROFILE v1.0]
${JSON.stringify(customProfile, null, 2)}
[/UACP:COMPANY-PROFILE]`;
};

export default sampleUACPContexts;