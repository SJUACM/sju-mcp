import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import {
  getAllPosts,
  getPostBySlug,
  getAllMeetings,
  getUpcomingMeetings,
  getCurrentEboardMembers,
  getPastEboardMembers,
  getAllHackathons,
  getHackathonsByStatus,
  getHackathonBySlug,
  getAllLandingPageGraphics,
  getLandingPageGraphicByTitle,
  getParallaxBanners,
  type BlogPost,
  type Meeting,
  type EboardMember,
  type Hackathon,
  type LandingPageGraphic,
  type ParallaxBanner,
} from "@/app/utils/contentful";
import { env } from "@/config/env";

const handler = createMcpHandler(
  server => {
    // RESOURCES - Expose Contentful content type schemas
    server.resource(
      "contentful-schema",
      "contentful://schema/content-types",
      async uri => ({
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(
              {
                contentTypes: [
                  {
                    id: "blogPost",
                    name: "Blog Post",
                    description:
                      "Blog posts with title, content, author, and publish date",
                    fields: [
                      "title",
                      "slug",
                      "content",
                      "excerpt",
                      "author",
                      "publishDate",
                      "coverImage",
                    ],
                  },
                  {
                    id: "meeting",
                    name: "Meeting",
                    description:
                      "Meeting records with date, description, location, and resources",
                    fields: [
                      "title",
                      "date",
                      "description",
                      "image",
                      "meetingLocation",
                      "slides",
                      "slidesUrl",
                      "recording",
                      "resourcesUrl",
                    ],
                  },
                  {
                    id: "eboardMember",
                    name: "Eboard Member",
                    description:
                      "Executive board members with position and contact info",
                    fields: [
                      "name",
                      "position",
                      "description",
                      "linkedin",
                      "github",
                      "year",
                      "image",
                      "memberType",
                    ],
                  },
                  {
                    id: "hackathon",
                    name: "Hackathon",
                    description:
                      "Hackathon events with dates, status, and registration info",
                    fields: [
                      "title",
                      "slug",
                      "description",
                      "startDate",
                      "endDate",
                      "status",
                      "registrationLink",
                      "details",
                      "image",
                    ],
                  },
                  {
                    id: "landingPageGraphics",
                    name: "Landing Page Graphics",
                    description:
                      "Graphics and images for landing page displays",
                    fields: ["title", "description", "image", "graphic"],
                  },
                  {
                    id: "parallaxBanner",
                    name: "Parallax Banner",
                    description: "Banner images with parallax effects",
                    fields: ["title", "image", "link"],
                  },
                ],
              },
              null,
              2
            ),
            mimeType: "application/json",
          },
        ],
      })
    );

    server.resource(
      "contentful-stats",
      "contentful://stats/overview",
      async uri => {
        try {
          const [
            posts,
            meetings,
            currentEboard,
            pastEboard,
            hackathons,
            graphics,
            banners,
          ] = await Promise.all([
            getAllPosts(),
            getAllMeetings(),
            getCurrentEboardMembers(),
            getPastEboardMembers(),
            getAllHackathons(),
            getAllLandingPageGraphics(),
            getParallaxBanners(),
          ]);

          return {
            contents: [
              {
                uri: uri.href,
                text: JSON.stringify(
                  {
                    overview: "Contentful CMS Statistics",
                    counts: {
                      blogPosts: posts.length,
                      meetings: meetings.length,
                      currentEboardMembers: currentEboard.length,
                      pastEboardMembers: pastEboard.length,
                      hackathons: hackathons.length,
                      landingPageGraphics: graphics.length,
                      parallaxBanners: banners.length,
                    },
                    lastUpdated: new Date().toISOString(),
                  },
                  null,
                  2
                ),
                mimeType: "application/json",
              },
            ],
          };
        } catch (error) {
          return {
            contents: [
              {
                uri: uri.href,
                text: `Error fetching Contentful statistics: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    );

    // TOOLS - Query Contentful data with parameters

    // Query blog posts
    server.tool(
      "query-blog-posts",
      "Query blog posts from Contentful",
      {
        slug: z
          .string()
          .optional()
          .describe("Optional slug to get a specific post"),
        limit: z.number().optional().describe("Limit number of results"),
      },
      async ({ slug, limit }) => {
        try {
          let results: BlogPost[];

          if (slug) {
            const post = await getPostBySlug(slug);
            results = post ? [post] : [];
          } else {
            results = await getAllPosts();
          }

          if (limit && limit > 0) {
            results = results.slice(0, limit);
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    query: "blog-posts",
                    parameters: { slug, limit },
                    count: results.length,
                    data: results.map(post => ({
                      id: post.sys.id,
                      title: post.fields.title,
                      slug: post.fields.slug,
                      excerpt: post.fields.excerpt,
                      author: post.fields.author,
                      publishDate: post.fields.publishDate,
                      coverImageUrl: post.fields.coverImage?.fields?.file?.url,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error querying blog posts: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Query meetings
    server.tool(
      "query-meetings",
      "Query meetings from Contentful",
      {
        type: z
          .enum(["all", "upcoming"])
          .optional()
          .describe("Type of meetings to fetch"),
        limit: z.number().optional().describe("Limit number of results"),
      },
      async ({ type = "all", limit }) => {
        try {
          let results: Meeting[];

          if (type === "upcoming") {
            results = await getUpcomingMeetings();
          } else {
            results = await getAllMeetings();
          }

          if (limit && limit > 0) {
            results = results.slice(0, limit);
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    query: "meetings",
                    parameters: { type, limit },
                    count: results.length,
                    data: results.map(meeting => ({
                      id: meeting.sys.id,
                      title: meeting.fields.title,
                      date: meeting.fields.date,
                      description: meeting.fields.description,
                      meetingLocation: meeting.fields.meetingLocation,
                      slidesUrl: meeting.fields.slidesUrl,
                      recording: meeting.fields.recording,
                      resourcesUrl: meeting.fields.resourcesUrl,
                      imageUrl: meeting.fields.image?.fields?.file?.url,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error querying meetings: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Query eboard members
    server.tool(
      "query-eboard-members",
      "Query executive board members from Contentful",
      {
        memberType: z
          .enum(["current", "past", "all"])
          .optional()
          .describe("Type of members to fetch"),
        limit: z.number().optional().describe("Limit number of results"),
      },
      async ({ memberType = "all", limit }) => {
        try {
          let results: EboardMember[];

          if (memberType === "current") {
            results = await getCurrentEboardMembers();
          } else if (memberType === "past") {
            results = await getPastEboardMembers();
          } else {
            const [current, past] = await Promise.all([
              getCurrentEboardMembers(),
              getPastEboardMembers(),
            ]);
            results = [...current, ...past];
          }

          if (limit && limit > 0) {
            results = results.slice(0, limit);
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    query: "eboard-members",
                    parameters: { memberType, limit },
                    count: results.length,
                    data: results.map(member => ({
                      id: member.sys.id,
                      name: member.fields.name,
                      position: member.fields.position,
                      description: member.fields.description,
                      linkedin: member.fields.linkedin,
                      github: member.fields.github,
                      year: member.fields.year,
                      memberType: member.fields.memberType,
                      imageUrl: member.fields.image?.fields?.file?.url,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error querying eboard members: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Query hackathons
    server.tool(
      "query-hackathons",
      "Query hackathons from Contentful",
      {
        status: z
          .enum(["ongoing", "upcoming", "past", "all"])
          .optional()
          .describe("Status of hackathons to fetch"),
        slug: z
          .string()
          .optional()
          .describe("Optional slug/ID to get a specific hackathon"),
        limit: z.number().optional().describe("Limit number of results"),
      },
      async ({ status = "all", slug, limit }) => {
        try {
          let results: Hackathon[];

          if (slug) {
            const hackathon = await getHackathonBySlug(slug);
            results = hackathon ? [hackathon] : [];
          } else if (status === "all") {
            results = await getAllHackathons();
          } else {
            results = await getHackathonsByStatus(status);
          }

          if (limit && limit > 0) {
            results = results.slice(0, limit);
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    query: "hackathons",
                    parameters: { status, slug, limit },
                    count: results.length,
                    data: results.map(hackathon => ({
                      id: hackathon.sys.id,
                      title: hackathon.fields.title,
                      slug: hackathon.fields.slug,
                      description: hackathon.fields.description,
                      startDate: hackathon.fields.startDate,
                      endDate: hackathon.fields.endDate,
                      status: hackathon.fields.status,
                      registrationLink: hackathon.fields.registrationLink,
                      imageUrl: hackathon.fields.image?.fields?.file?.url,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error querying hackathons: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Query landing page graphics
    server.tool(
      "query-graphics",
      "Query landing page graphics from Contentful",
      {
        title: z
          .string()
          .optional()
          .describe("Optional title to get a specific graphic"),
        limit: z.number().optional().describe("Limit number of results"),
      },
      async ({ title, limit }) => {
        try {
          let results: LandingPageGraphic[];

          if (title) {
            const graphic = await getLandingPageGraphicByTitle(title);
            results = graphic ? [graphic] : [];
          } else {
            results = await getAllLandingPageGraphics();
          }

          if (limit && limit > 0) {
            results = results.slice(0, limit);
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    query: "landing-page-graphics",
                    parameters: { title, limit },
                    count: results.length,
                    data: results.map(graphic => ({
                      id: graphic.sys.id,
                      title: graphic.fields.title,
                      description: graphic.fields.description,
                      imageUrl:
                        graphic.fields.image?.fields?.file?.url ||
                        graphic.fields.graphic?.fields?.file?.url,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error querying graphics: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Query parallax banners
    server.tool(
      "query-banners",
      "Query parallax banners from Contentful",
      {
        limit: z.number().optional().describe("Limit number of results"),
      },
      async ({ limit }) => {
        try {
          let results: ParallaxBanner[] = await getParallaxBanners();

          if (limit && limit > 0) {
            results = results.slice(0, limit);
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    query: "parallax-banners",
                    parameters: { limit },
                    count: results.length,
                    data: results.map(banner => ({
                      id: banner.sys.id,
                      title: banner.fields.title,
                      link: banner.fields.link,
                      imageUrl: banner.fields.image?.fields?.file?.url,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error querying banners: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Search across all content types
    server.tool(
      "search-content",
      "Search across all Contentful content types",
      {
        query: z
          .string()
          .describe("Search query to match against titles and descriptions"),
        contentTypes: z
          .array(
            z.enum([
              "blogPost",
              "meeting",
              "eboardMember",
              "hackathon",
              "landingPageGraphics",
              "parallaxBanner",
            ])
          )
          .optional()
          .describe("Specific content types to search in"),
        limit: z
          .number()
          .optional()
          .describe("Limit number of results per content type"),
      },
      async ({ query: searchQuery, contentTypes, limit = 5 }) => {
        try {
          const searchResults: any = {};
          const typesToSearch = contentTypes || [
            "blogPost",
            "meeting",
            "eboardMember",
            "hackathon",
            "landingPageGraphics",
            "parallaxBanner",
          ];

          // Helper function to search in text fields
          const matchesQuery = (text: string): boolean => {
            return text.toLowerCase().includes(searchQuery.toLowerCase());
          };

          // Search blog posts
          if (typesToSearch.includes("blogPost")) {
            const posts = await getAllPosts();
            searchResults.blogPosts = posts
              .filter(
                post =>
                  matchesQuery(post.fields.title) ||
                  matchesQuery(post.fields.excerpt) ||
                  matchesQuery(post.fields.author)
              )
              .slice(0, limit)
              .map(post => ({
                id: post.sys.id,
                type: "blogPost",
                title: post.fields.title,
                slug: post.fields.slug,
                excerpt: post.fields.excerpt,
                author: post.fields.author,
              }));
          }

          // Search meetings
          if (typesToSearch.includes("meeting")) {
            const meetings = await getAllMeetings();
            searchResults.meetings = meetings
              .filter(
                meeting =>
                  matchesQuery(meeting.fields.title) ||
                  matchesQuery(meeting.fields.description)
              )
              .slice(0, limit)
              .map(meeting => ({
                id: meeting.sys.id,
                type: "meeting",
                title: meeting.fields.title,
                date: meeting.fields.date,
                description: meeting.fields.description,
              }));
          }

          // Search eboard members
          if (typesToSearch.includes("eboardMember")) {
            const [current, past] = await Promise.all([
              getCurrentEboardMembers(),
              getPastEboardMembers(),
            ]);
            const allMembers = [...current, ...past];
            searchResults.eboardMembers = allMembers
              .filter(
                member =>
                  matchesQuery(member.fields.name) ||
                  matchesQuery(member.fields.position) ||
                  matchesQuery(member.fields.description)
              )
              .slice(0, limit)
              .map(member => ({
                id: member.sys.id,
                type: "eboardMember",
                name: member.fields.name,
                position: member.fields.position,
                memberType: member.fields.memberType,
              }));
          }

          // Search hackathons
          if (typesToSearch.includes("hackathon")) {
            const hackathons = await getAllHackathons();
            searchResults.hackathons = hackathons
              .filter(
                hackathon =>
                  matchesQuery(hackathon.fields.title) ||
                  matchesQuery(hackathon.fields.description)
              )
              .slice(0, limit)
              .map(hackathon => ({
                id: hackathon.sys.id,
                type: "hackathon",
                title: hackathon.fields.title,
                description: hackathon.fields.description,
                status: hackathon.fields.status,
              }));
          }

          const totalResults = Object.values(searchResults).reduce(
            (sum: number, arr: any) => sum + (arr?.length || 0),
            0
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    searchQuery,
                    contentTypes: typesToSearch,
                    totalResults,
                    results: searchResults,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error searching content: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  },
  {
    capabilities: {
      resources: {
        "contentful-schema": {
          description: "Contentful content type schemas and field definitions",
        },
        "contentful-stats": {
          description: "Overview statistics of all Contentful content",
        },
      },
      tools: {
        "query-blog-posts": {
          description: "Query blog posts with optional slug filtering",
        },
        "query-meetings": {
          description: "Query meetings (all or upcoming)",
        },
        "query-eboard-members": {
          description: "Query executive board members (current, past, or all)",
        },
        "query-hackathons": {
          description: "Query hackathons by status or specific slug/ID",
        },
        "query-graphics": {
          description: "Query landing page graphics by title or get all",
        },
        "query-banners": {
          description: "Query parallax banners",
        },
        "search-content": {
          description: "Search across all content types with text matching",
        },
      },
    },
  },
  {
    redisUrl: env.REDIS_URL,
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
