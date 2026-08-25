"use client"

import { useState } from "react"
import {
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiNotification3Line,
} from "@remixicon/react"
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@gitbruv/hooks"
import { NotificationItem } from "@/components/notifications/notification-item"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"

const PAGE_SIZE = 30

export function NotificationsView() {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [offset, setOffset] = useState(0)

  const { data, isLoading } = useNotifications({ limit: PAGE_SIZE, offset, unreadOnly })
  const { data: unreadData } = useUnreadNotificationCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotification = useDeleteNotification()

  const notifications = data?.notifications ?? []
  const hasMore = data?.hasMore ?? false
  const unreadCount = unreadData?.count ?? 0

  return (
    <PageContainer>
      <PageHeader
        className="mb-4"
        title={
          <span className="flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
        }
        actions={
          unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <RiCheckboxCircleLine className="size-4" />
              Mark all read
            </Button>
          )
        }
      />

      <Tabs
        value={unreadOnly ? "unread" : "all"}
        onValueChange={(v) => {
          setUnreadOnly(v === "unread")
          setOffset(0)
        }}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 border-b p-3 last:border-b-0">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="mb-2 h-4 w-64" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiNotification3Line />
            </EmptyMedia>
            <EmptyTitle>
              {unreadOnly ? "You're all caught up" : "No notifications yet"}
            </EmptyTitle>
            <EmptyDescription>
              {unreadOnly
                ? "You have no unread notifications."
                : "Activity on your repositories will show up here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border">
          {notifications.map((notification) => (
            <div key={notification.id} className="group/row relative flex items-center">
              <div className="min-w-0 flex-1">
                <NotificationItem
                  notification={notification}
                  onMarkRead={() => markRead.mutate(notification.id)}
                />
              </div>
              <button
                type="button"
                aria-label="Delete notification"
                onClick={() => deleteNotification.mutate(notification.id)}
                className="mr-3 text-muted-foreground opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 hover:text-foreground focus-visible:opacity-100 motion-reduce:transition-none"
              >
                <RiDeleteBinLine className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(offset > 0 || hasMore) && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            Newer
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Older
          </Button>
        </div>
      )}
    </PageContainer>
  )
}
