import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.API_BASE ?? "http://localhost:7001";

const server = new Server(
  {
    name: "worldcup-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_teams",
      description: "获取所有参赛球队信息，包括队名、缩写、所属国家、分组",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_matches",
      description: "获取比赛列表，可按状态筛选(scheduled/live/finished)",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["scheduled", "live", "finished"] },
        },
      },
    },
    {
      name: "get_match_detail",
      description: "获取指定比赛的详细信息，包括比分、时间、场地、球队",
      inputSchema: {
        type: "object",
        properties: {
          matchId: { type: "number" },
        },
        required: ["matchId"],
      },
    },
    {
      name: "get_standings",
      description: "获取所有小组的积分榜，包括胜平负、进球、失球、积分",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_predictions",
      description: "获取用户对比赛的比分预测",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "number" },
          matchId: { type: "number" },
        },
      },
    },
    {
      name: "get_comments",
      description: "获取某场比赛的评论列表",
      inputSchema: {
        type: "object",
        properties: {
          matchId: { type: "number" },
        },
        required: ["matchId"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_teams": {
      const res = await fetch(`${API_BASE}/api/teams`);
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data.data, null, 2) }],
      };
    }
    case "get_matches": {
      let url = `${API_BASE}/api/matches`;
      if (args?.status) url += `?status=${args.status}`;
      const res = await fetch(url);
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data.data, null, 2) }],
      };
    }
    case "get_match_detail": {
      const res = await fetch(`${API_BASE}/api/matches/${args?.matchId}`);
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data.data, null, 2) }],
      };
    }
    case "get_standings": {
      const res = await fetch(`${API_BASE}/api/standings`);
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data.data, null, 2) }],
      };
    }
    case "get_predictions": {
      let url = `${API_BASE}/api/predictions?`;
      if (args?.userId) url += `userId=${args.userId}&`;
      if (args?.matchId) url += `matchId=${args.matchId}`;
      const res = await fetch(url);
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data.data, null, 2) }],
      };
    }
    case "get_comments": {
      const res = await fetch(
        `${API_BASE}/api/comments?matchId=${args?.matchId}`,
      );
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data.data, null, 2) }],
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WorldCup MCP Server running on stdio");
}

main().catch(console.error);
