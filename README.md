# SJU ACM MCP Server

**Next.js MCP Server for SJU ACM**

This MCP (Model Context Protocol) server provides AI-friendly access to SJU ACM's CMS data through a set of tools and resources. Built with Next.js and the `@vercel/mcp-adapter`, it enables AI assistants to query, search, and retrieve content from a Contentful space.

## Add to Cursor

Go to Cursor Settings -> MCP -> Add MCP Server -> paste the JSON below:

```json
{
  "mcpServers": {
    "SJU-ACM-MCP": {
      "url": "https://sju-mcp.vercel.app/sse"
    }
  }
}
```


## Features

### Content Types Supported
- **Blog Posts** - Articles with rich content, authors, and publish dates
- **Meetings** - Meeting records with dates, locations, slides, and recordings
- **Executive Board Members** - Team member profiles with positions and contact info
- **Hackathons** - Event information with dates, status, and registration links
- **Landing Page Graphics** - Visual assets for website displays
- **Parallax Banners** - Interactive banner images with links

### Available Resources

#### `contentful-schema`
- **URI**: `contentful://schema/content-types`
- **Description**: Complete Contentful content type schemas and field definitions
- **Use Case**: Understanding the data structure and available fields for each content type

#### `contentful-stats`
- **URI**: `contentful://stats/overview`
- **Description**: Real-time statistics and counts for all content types
- **Use Case**: Getting overview metrics of your Contentful space content

### Available Tools

#### `query-blog-posts`
Query blog posts with optional filtering
- **Parameters**:
  - `slug` (optional): Get a specific post by slug
  - `limit` (optional): Limit number of results
- **Returns**: Blog post data with titles, excerpts, authors, and cover images

#### `query-meetings`
Query meeting records
- **Parameters**:
  - `type` (optional): "all" or "upcoming" meetings
  - `limit` (optional): Limit number of results
- **Returns**: Meeting details with dates, locations, slides, and recordings

#### `query-eboard-members`
Query executive board members
- **Parameters**:
  - `memberType` (optional): "current", "past", or "all"
  - `limit` (optional): Limit number of results
- **Returns**: Member profiles with positions, LinkedIn, GitHub, and photos

#### `query-hackathons`
Query hackathon events
- **Parameters**:
  - `status` (optional): "ongoing", "upcoming", "past", or "all"
  - `slug` (optional): Get specific hackathon by slug/ID
  - `limit` (optional): Limit number of results
- **Returns**: Hackathon details with dates, registration links, and status

#### `query-graphics`
Query landing page graphics
- **Parameters**:
  - `title` (optional): Get specific graphic by title
  - `limit` (optional): Limit number of results
- **Returns**: Graphic assets with titles, descriptions, and image URLs

#### `query-banners`
Query parallax banners
- **Parameters**:
  - `limit` (optional): Limit number of results
- **Returns**: Banner data with titles, links, and image URLs

#### `search-content`
Universal search across all content types
- **Parameters**:
  - `query`: Search term to match against titles and descriptions
  - `contentTypes` (optional): Specific content types to search in
  - `limit` (optional): Limit results per content type (default: 5)
- **Returns**: Matching content across specified or all content types

## Setup

### Environment Variables
Create a `.env.local` file with your Contentful credentials:

```env
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ACCESS_TOKEN=your_access_token
REDIS_URL=your_redis_url # Required for SSE transport on Vercel
```

### Installation
```bash
npm install
# or
yarn install
# or
pnpm install
```

### Development
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## Deployment on Vercel

### Requirements
- Redis database attached to your Vercel project under `REDIS_URL`
- [Fluid Compute](https://vercel.com/docs/functions/fluid-compute) enabled for efficient execution
- Contentful space with the supported content types

### Configuration
1. Set up your Contentful environment variables in Vercel
2. Enable Fluid Compute in your Vercel project settings
3. For Pro/Enterprise accounts, adjust `maxDuration` to 800 in `app/[transport]/route.ts`
4. Deploy using the [Next.js MCP template](https://vercel.com/templates/next.js/model-context-protocol-mcp-with-next-js)

## Usage Examples

### Querying Blog Posts
```json
{
  "tool": "query-blog-posts",
  "parameters": {
    "limit": 5
  }
}
```

### Searching Content
```json
{
  "tool": "search-content",
  "parameters": {
    "query": "hackathon",
    "contentTypes": ["hackathon", "meeting"],
    "limit": 3
  }
}
```

### Getting Current E-board Members
```json
{
  "tool": "query-eboard-members",
  "parameters": {
    "memberType": "current"
  }
}
```

## Testing

Use the included test client to verify your deployment:

```bash
node scripts/test-client.mjs https://your-deployment-url.vercel.app
```

## Technical Details

- **Framework**: Next.js with App Router
- **MCP Adapter**: `@vercel/mcp-adapter`
- **CMS**: Contentful
- **Validation**: Zod schemas
- **Transport**: HTTP and SSE (Server-Sent Events)
- **Maximum Duration**: 60 seconds per request

## Content Type Schema

The server exposes detailed schema information through the `contentful-schema` resource, including field definitions for:
- Rich text content and media assets
- Date/time fields and status enums
- Relationship fields between content types
- Localization and metadata fields

This makes it easy for AI assistants to understand your content structure and generate appropriate queries.
