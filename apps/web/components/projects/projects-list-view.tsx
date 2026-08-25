"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { RiAddLine, RiKanbanView2 } from "@remixicon/react"
import { useProjects, useCreateProject } from "@gitbruv/hooks"
import { formatRelativeTime } from "@gitbruv/lib"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"

export function ProjectsListView() {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)

  const { data, isLoading } = useProjects(username, repo)
  const createProject = useCreateProject(username, repo)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")

  const projects = data?.projects || []

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()

    if (!newProjectName.trim()) return

    try {
      await createProject.mutateAsync({ name: newProjectName })
      toast.success("Project created")
      setNewProjectName("")
      setIsDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project")
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        actions={
          projects.length > 0 && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <RiAddLine className="size-4" />
              New project
            </Button>
          )
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Project name</FieldLabel>
                <Input
                  id="name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Project"
                  required
                />
              </Field>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProject.isPending || !newProjectName.trim()}
                >
                  {createProject.isPending && <Spinner />}
                  {createProject.isPending ? "Creating..." : "Create project"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Empty className="border border-dashed py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiKanbanView2 />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>Create a project board to organize your work.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setIsDialogOpen(true)}>
              <RiAddLine className="size-4" />
              New project
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="py-0 transition-colors duration-100 hover:bg-muted/30 motion-reduce:transition-none"
            >
              <Link
                href={`/${username}/${repo}/projects/${project.id}`}
                className="block p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded bg-muted p-2">
                    <RiKanbanView2 className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{project.name}</h3>
                    {project.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Created {formatRelativeTime(project.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
