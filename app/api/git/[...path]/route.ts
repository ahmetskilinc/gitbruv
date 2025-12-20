import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, repositories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { withTempRepo } from "@/lib/r2-git-sync";
import { auth } from "@/lib/auth";

async function authenticateUser(authHeader: string | null): Promise<{ id: string; username: string } | null> {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return null;
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [email, password] = credentials.split(":");

  if (!email || !password) {
    return null;
  }

  try {
    const result = await auth.api.signInEmail({
      body: { email, password },
    });

    if (!result?.user) {
      return null;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return null;
    }

    return { id: user.id, username: user.username };
  } catch {
    return null;
  }
}

function runGitCommand(command: string, args: string[], cwd: string, input?: Buffer): Promise<{ stdout: Buffer; stderr: Buffer; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd,
      env: { ...process.env, GIT_DIR: cwd },
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    proc.stdout.on("data", (data) => stdout.push(data));
    proc.stderr.on("data", (data) => stderr.push(data));

    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }

    proc.on("close", (code) => {
      resolve({
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
        code: code || 0,
      });
    });
  });
}

function parseGitPath(pathSegments: string[]): { username: string; repoName: string; action: string | null } | null {
  if (pathSegments.length < 2) return null;

  const username = pathSegments[0];
  let repoName = pathSegments[1];

  if (repoName.endsWith(".git")) {
    repoName = repoName.slice(0, -4);
  }

  const remainingPath = pathSegments.slice(2).join("/");

  let action: string | null = null;
  if (remainingPath === "info/refs") {
    action = "info/refs";
  } else if (remainingPath === "git-upload-pack") {
    action = "git-upload-pack";
  } else if (remainingPath === "git-receive-pack") {
    action = "git-receive-pack";
  }

  return { username, repoName, action };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await params;
  const parsed = parseGitPath(pathSegments);

  if (!parsed) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { username, repoName, action } = parsed;

  const owner = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!owner) {
    return new NextResponse("Repository not found", { status: 404 });
  }

  const repo = await db.query.repositories.findFirst({
    where: and(eq(repositories.ownerId, owner.id), eq(repositories.name, repoName)),
  });

  if (!repo) {
    return new NextResponse("Repository not found", { status: 404 });
  }

  if (repo.visibility === "private") {
    const user = await authenticateUser(request.headers.get("authorization"));
    if (!user || user.id !== repo.ownerId) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="gitbruv"' },
      });
    }
  }

  if (action === "info/refs") {
    const serviceQuery = request.nextUrl.searchParams.get("service");

    if (serviceQuery === "git-upload-pack" || serviceQuery === "git-receive-pack") {
      const serviceName = serviceQuery;

      if (serviceName === "git-receive-pack") {
        const user = await authenticateUser(request.headers.get("authorization"));
        if (!user || user.id !== repo.ownerId) {
          return new NextResponse("Unauthorized", {
            status: 401,
            headers: { "WWW-Authenticate": 'Basic realm="gitbruv"' },
          });
        }
      }

      const response = await withTempRepo(owner.id, repoName, async (tempDir) => {
        const { stdout } = await runGitCommand("git", [serviceName.replace("git-", ""), "--advertise-refs", "."], tempDir);

        const packet = `# service=${serviceName}\n`;
        const packetLen = (packet.length + 4).toString(16).padStart(4, "0");
        return Buffer.concat([Buffer.from(packetLen + packet + "0000"), stdout]);
      });

      return new NextResponse(new Uint8Array(response), {
        headers: {
          "Content-Type": `application/x-${serviceName}-advertisement`,
          "Cache-Control": "no-cache",
        },
      });
    }

    const infoRefs = await withTempRepo(owner.id, repoName, async (tempDir) => {
      await runGitCommand("git", ["update-server-info"], tempDir);

      try {
        return await fs.readFile(path.join(tempDir, "info", "refs"), "utf-8");
      } catch {
        return "";
      }
    });

    return new NextResponse(infoRefs, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new NextResponse("Not found", { status: 404 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await params;
  const parsed = parseGitPath(pathSegments);

  if (!parsed) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { username, repoName, action } = parsed;

  if (action !== "git-upload-pack" && action !== "git-receive-pack") {
    return new NextResponse("Not found", { status: 404 });
  }

  const owner = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!owner) {
    return new NextResponse("Repository not found", { status: 404 });
  }

  const repo = await db.query.repositories.findFirst({
    where: and(eq(repositories.ownerId, owner.id), eq(repositories.name, repoName)),
  });

  if (!repo) {
    return new NextResponse("Repository not found", { status: 404 });
  }

  const user = await authenticateUser(request.headers.get("authorization"));

  if (action === "git-receive-pack") {
    if (!user || user.id !== repo.ownerId) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="gitbruv"' },
      });
    }
  } else if (repo.visibility === "private") {
    if (!user || user.id !== repo.ownerId) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="gitbruv"' },
      });
    }
  }

  const body = await request.arrayBuffer();
  const input = Buffer.from(body);

  const serviceName = action.replace("git-", "");
  const shouldSyncBack = action === "git-receive-pack";

  const { stdout, stderr, code } = await withTempRepo(
    owner.id,
    repoName,
    async (tempDir) => {
      return await runGitCommand("git", [serviceName, "--stateless-rpc", "."], tempDir, input);
    },
    shouldSyncBack
  );

  if (code !== 0) {
    console.error("Git error:", stderr.toString());
  }

  return new NextResponse(new Uint8Array(stdout), {
    headers: {
      "Content-Type": `application/x-${action}-result`,
      "Cache-Control": "no-cache",
    },
  });
}
